"""
コース管理API

コース一覧、詳細、進行可能範囲の制御などのコース関連のエンドポイントを提供する。
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.course import Course, Chapter, ProgressRecord
from app.schemas.course import (
    CourseResponse,
    CourseWithProgress,
    CourseCreate,
    CourseUpdate,
    ChapterResponse,
    ChecklistItemResponse,
    ProgressRecordResponse,
    ProgressRecordCreate,
)
from app.auth import get_current_user, get_current_user_optional
from app.utils.course_access import check_course_access, get_user_accessible_courses

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("/", response_model=List[CourseWithProgress])
async def get_courses(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    コース一覧を取得
    
    アクセス可能なコースの一覧を取得し、進捗情報を含めて返す。
    認証なしでもコース一覧を取得可能（進捗情報は0.0、is_accessibleは適切に設定）。
    
    Args:
        current_user: 現在のユーザー（認証オプショナル）
        db: データベースセッション
        
    Returns:
        List[CourseWithProgress]: コース一覧（進捗情報付き）
    """
    try:
        # すべてのコースを取得（is_activeがfalseでも準備中として表示するため）
        all_courses = db.query(Course).order_by(Course.order_index, Course.id).all()
        
        print(f"[DEBUG] Found {len(all_courses)} active courses")
        print(f"[DEBUG] Current user: {current_user.username if current_user else 'None'}")
        
        # NOTE: 以前はここで「認証なし向けの無料コース」を course.id のハードコードで作っていたが、
        # ハードコード禁止ルールに従い撤廃した（現ロジックでは未使用だった）。
        if current_user:
            _ = get_user_accessible_courses(current_user, db)
        
        result = []
        for course in all_courses:
            try:
                # アクセス可能性を判定
                # is_activeがfalseの場合は準備中としてis_accessibleをfalseにする
                if not course.is_active:
                    is_accessible = False
                    progress_info = {"completion_rate": 0.0, "last_studied_chapter_id": None}
                elif current_user:
                    is_accessible = check_course_access(current_user, course, db)
                    # 進捗情報を計算
                    progress_info = calculate_course_progress(current_user.id, course.id, db)
                else:
                    # 認証なしの場合は、すべてのコースの章一覧・概要を見れるようにする
                    # 実際に章の内容にアクセスするときはログインを求める
                    is_accessible = True  # すべてのコースで章一覧・概要を見れる
                    progress_info = {"completion_rate": 0.0, "last_studied_chapter_id": None}
                
                course_dict = {
                    **CourseResponse.model_validate(course).model_dump(),
                    "completion_rate": progress_info["completion_rate"],
                    "last_studied_chapter_id": progress_info["last_studied_chapter_id"],
                    "is_accessible": is_accessible,
                }
                result.append(CourseWithProgress(**course_dict))
            except Exception as e:
                print(f"[ERROR] Failed to process course {course.id}: {e}")
                import traceback
                traceback.print_exc()
                # エラーが発生したコースはスキップして続行
                continue
        
        print(f"[DEBUG] Returning {len(result)} courses")
        return result
    except Exception as e:
        print(f"[ERROR] Failed to get courses: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get courses: {str(e)}"
        )


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    コース詳細を取得
    
    指定されたコースの詳細情報を返す。
    アクセス権限をチェックし、アクセスできない場合はエラーを返す。
    
    Args:
        course_id: コースID
        current_user: 現在のユーザー（認証必須）
        db: データベースセッション
        
    Returns:
        CourseResponse: コース情報
        
    Raises:
        HTTPException: コースが見つからない場合（404）、アクセス権限がない場合（403）
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # アクセス権限チェック
    if not check_course_access(current_user, course, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this course"
        )
    
    return course


@router.get("/{course_id}/chapters", response_model=List[ChapterResponse])
async def get_course_chapters(
    course_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    コースの章一覧を取得
    
    指定されたコースの章一覧を返す。
    認証なしでも章一覧を取得可能（各章を選択したときにログインを求める）。
    
    Args:
        course_id: コースID
        current_user: 現在のユーザー（認証オプショナル）
        db: データベースセッション
        
    Returns:
        List[ChapterResponse]: 章一覧
        
    Raises:
        HTTPException: コースが見つからない場合（404）
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # 認証済みの場合はアクセス権限をチェック
    if current_user:
        if not check_course_access(current_user, course, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this course"
            )
    
    chapters = db.query(Chapter).filter(
        Chapter.course_id == course_id,
        Chapter.is_active == True
    ).order_by(Chapter.order_index, Chapter.id).all()
    
    return chapters


@router.get("/{course_id}/chapters/{chapter_id}", response_model=ChapterResponse)
async def get_chapter(
    course_id: int,
    chapter_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    章詳細を取得
    
    指定された章の詳細情報を返す。
    認証なしでも章詳細を取得可能（各章を選択したときにログインを求める）。
    
    Args:
        course_id: コースID
        chapter_id: 章ID
        current_user: 現在のユーザー（認証オプショナル）
        db: データベースセッション
        
    Returns:
        ChapterResponse: 章情報
        
    Raises:
        HTTPException: 章が見つからない場合（404）
    """
    chapter = db.query(Chapter).filter(
        Chapter.id == chapter_id,
        Chapter.course_id == course_id,
        Chapter.is_active == True
    ).first()
    
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found"
        )
    
    return chapter


def calculate_course_progress(user_id: int, course_id: int, db: Session) -> dict:
    """
    コースの進捗を計算する
    
    Args:
        user_id: ユーザーID
        course_id: コースID
        db: データベースセッション
        
    Returns:
        dict: 進捗情報（completion_rate, last_studied_chapter_id）
    """
    # コースの全章を取得
    chapters = db.query(Chapter).filter(
        Chapter.course_id == course_id,
        Chapter.is_active == True
    ).all()
    
    if not chapters:
        return {"completion_rate": 0.0, "last_studied_chapter_id": None}
    
    # 完了した章を取得
    completed_chapters = db.query(ProgressRecord.chapter_id).filter(
        ProgressRecord.user_id == user_id,
        ProgressRecord.chapter_id.in_([ch.id for ch in chapters]),
        ProgressRecord.is_completed == True
    ).distinct().all()
    
    completed_count = len(completed_chapters)
    total_count = len(chapters)
    completion_rate = completed_count / total_count if total_count > 0 else 0.0
    
    # 最後に学習した章を取得
    last_record = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == user_id,
        ProgressRecord.chapter_id.in_([ch.id for ch in chapters]),
        ProgressRecord.is_completed == True
    ).order_by(ProgressRecord.updated_at.desc()).first()
    
    last_studied_chapter_id = last_record.chapter_id if last_record else None
    
    return {
        "completion_rate": completion_rate,
        "last_studied_chapter_id": last_studied_chapter_id,
    }

