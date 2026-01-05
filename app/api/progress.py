"""
学習記録API

チェックマークの付与・解除、進捗情報の取得、エクスポート/インポートなどの学習記録関連のエンドポイントを提供する。
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models.user import User
from app.models.course import ProgressRecord, Chapter, ChecklistItem
from app.schemas.course import ProgressRecordResponse, ProgressRecordCreate
from app.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/progress", tags=["progress"])


class ProgressExport(BaseModel):
    """進捗エクスポートデータ"""
    version: str = "1.0"
    exported_at: str
    user_id: int
    records: List[ProgressRecordResponse]


class ProgressImport(BaseModel):
    """進捗インポートデータ"""
    records: List[ProgressRecordCreate]


@router.post("/", response_model=ProgressRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_progress_record(
    progress_data: ProgressRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    学習記録を作成または更新
    
    チェックマークを付与する（既に存在する場合は更新）。
    
    Args:
        progress_data: 学習記録データ（chapter_id または checklist_item_id のいずれかが必要）
        current_user: 現在のユーザー（認証必須）
        db: データベースセッション
        
    Returns:
        ProgressRecordResponse: 作成または更新された学習記録
        
    Raises:
        HTTPException: chapter_id と checklist_item_id の両方が指定されていない場合（400）
    """
    if not progress_data.chapter_id and not progress_data.checklist_item_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either chapter_id or checklist_item_id must be provided"
        )
    
    # 既存のレコードを検索
    query = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id
    )
    
    if progress_data.chapter_id:
        query = query.filter(ProgressRecord.chapter_id == progress_data.chapter_id)
        # チェックリスト項目が指定されている場合はそれもフィルタ
        if progress_data.checklist_item_id:
            query = query.filter(ProgressRecord.checklist_item_id == progress_data.checklist_item_id)
        else:
            query = query.filter(ProgressRecord.checklist_item_id == None)
    elif progress_data.checklist_item_id:
        query = query.filter(ProgressRecord.checklist_item_id == progress_data.checklist_item_id)
    
    existing_record = query.first()
    
    if existing_record:
        # 既存のレコードを更新
        existing_record.is_completed = progress_data.is_completed
        if progress_data.is_completed:
            existing_record.completed_at = datetime.utcnow()
        else:
            existing_record.completed_at = None
        existing_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_record)
        return existing_record
    else:
        # 新しいレコードを作成
        db_record = ProgressRecord(
            user_id=current_user.id,
            chapter_id=progress_data.chapter_id,
            checklist_item_id=progress_data.checklist_item_id,
            is_completed=progress_data.is_completed,
            completed_at=datetime.utcnow() if progress_data.is_completed else None,
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record


@router.get("/", response_model=List[ProgressRecordResponse])
async def get_progress_records(
    chapter_id: Optional[int] = None,
    checklist_item_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    学習記録を取得
    
    ユーザーの学習記録を取得する。オプションで章IDまたはチェックリスト項目IDでフィルタリング可能。
    
    Args:
        chapter_id: 章ID（オプション）
        checklist_item_id: チェックリスト項目ID（オプション）
        current_user: 現在のユーザー（認証必須）
        db: データベースセッション
        
    Returns:
        List[ProgressRecordResponse]: 学習記録のリスト
    """
    query = db.query(ProgressRecord).filter(ProgressRecord.user_id == current_user.id)
    
    if chapter_id:
        query = query.filter(ProgressRecord.chapter_id == chapter_id)
    
    if checklist_item_id:
        query = query.filter(ProgressRecord.checklist_item_id == checklist_item_id)
    
    records = query.order_by(ProgressRecord.updated_at.desc()).all()
    return records


@router.get("/export", response_model=ProgressExport)
async def export_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    学習記録をエクスポート（JSON形式）
    
    ユーザーのすべての学習記録をJSON形式でエクスポートする。
    他のアプリやデバイスでインポート可能な形式で出力する。
    
    Args:
        current_user: 現在のユーザー（認証必須）
        db: データベースセッション
        
    Returns:
        ProgressExport: エクスポートデータ
    """
    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id
    ).order_by(ProgressRecord.updated_at.desc()).all()
    
    return ProgressExport(
        version="1.0",
        exported_at=datetime.utcnow().isoformat(),
        user_id=current_user.id,
        records=[ProgressRecordResponse.model_validate(r) for r in records]
    )


@router.post("/import", response_model=List[ProgressRecordResponse])
async def import_progress(
    import_data: ProgressImport,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    学習記録をインポート（JSON形式）
    
    他のアプリやデバイスからエクスポートした学習記録をインポートする。
    既存のレコードとマージする（同じchapter_id/checklist_item_idの場合は更新）。
    
    Args:
        import_data: インポートデータ
        current_user: 現在のユーザー（認証必須）
        db: データベースセッション
        
    Returns:
        List[ProgressRecordResponse]: インポートされた学習記録のリスト
    """
    imported_records = []
    
    for record_data in import_data.records:
        # 既存のレコードを検索
        query = db.query(ProgressRecord).filter(
            ProgressRecord.user_id == current_user.id
        )
        
        if record_data.chapter_id:
            query = query.filter(ProgressRecord.chapter_id == record_data.chapter_id)
            if record_data.checklist_item_id:
                query = query.filter(ProgressRecord.checklist_item_id == record_data.checklist_item_id)
            else:
                query = query.filter(ProgressRecord.checklist_item_id == None)
        elif record_data.checklist_item_id:
            query = query.filter(ProgressRecord.checklist_item_id == record_data.checklist_item_id)
        
        existing_record = query.first()
        
        if existing_record:
            # 既存のレコードを更新
            existing_record.is_completed = record_data.is_completed
            if record_data.is_completed:
                existing_record.completed_at = datetime.utcnow()
            else:
                existing_record.completed_at = None
            existing_record.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_record)
            imported_records.append(existing_record)
        else:
            # 新しいレコードを作成
            db_record = ProgressRecord(
                user_id=current_user.id,
                chapter_id=record_data.chapter_id,
                checklist_item_id=record_data.checklist_item_id,
                is_completed=record_data.is_completed,
                completed_at=datetime.utcnow() if record_data.is_completed else None,
            )
            db.add(db_record)
            db.commit()
            db.refresh(db_record)
            imported_records.append(db_record)
    
    return [ProgressRecordResponse.model_validate(r) for r in imported_records]


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_progress_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    学習記録を削除（チェックマークを解除）
    
    指定された学習記録を削除する。ユーザー自身のレコードのみ削除可能。
    
    Args:
        record_id: レコードID
        current_user: 現在のユーザー（認証必須）
        db: データベースセッション
        
    Raises:
        HTTPException: レコードが見つからない場合（404）、権限がない場合（403）
    """
    record = db.query(ProgressRecord).filter(ProgressRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress record not found"
        )
    
    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this record"
        )
    
    db.delete(record)
    db.commit()
    return None
