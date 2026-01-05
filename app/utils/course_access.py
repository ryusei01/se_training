"""
コースアクセス制御ユーティリティ

ユーザーの課金状態に基づいてコースへのアクセス権限を判定する。
"""
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user import User, SubscriptionStatus
from app.models.course import Course
from typing import List


def check_course_access(user: User, course: Course, db: Session) -> bool:
    """
    ユーザーがコースにアクセス可能かどうかを判定する
    
    Args:
        user: ユーザーオブジェクト
        course: コースオブジェクト
        db: データベースセッション
        
    Returns:
        bool: アクセス可能な場合True
    """
    # PAID状態の場合はすべてのコースにアクセス可能
    if user.subscription_status == SubscriptionStatus.PAID:
        return True
    
    # TRIAL状態の場合
    if user.subscription_status == SubscriptionStatus.TRIAL:
        # トライアル期限をチェック
        if user.trial_ends_at and datetime.utcnow() > user.trial_ends_at:
            # トライアル期限切れの場合はFREE状態として扱う
            # 実際のアプリでは、ここで状態を更新すべき
            pass
        else:
            # トライアル期間中はすべてのコースにアクセス可能
            return True
    
    # FREE状態の場合
    if user.subscription_status == SubscriptionStatus.FREE:
        # 無料範囲（DB駆動）
        # NOTE: 以前は course.id のハードコードで無料範囲を決めていたが、禁止ルールに従い is_free に統一する。
        return bool(getattr(course, "is_free", False))
    
    return False


def get_user_accessible_courses(user: User, db: Session) -> List[int]:
    """
    ユーザーがアクセス可能なコースIDのリストを取得する
    
    Args:
        user: ユーザーオブジェクト
        db: データベースセッション
        
    Returns:
        List[int]: アクセス可能なコースIDのリスト
    """
    # PAID状態の場合はすべてのアクティブなコース
    if user.subscription_status == SubscriptionStatus.PAID:
        courses = db.query(Course.id).filter(Course.is_active == True).all()
        return [c.id for c in courses]
    
    # TRIAL状態の場合
    if user.subscription_status == SubscriptionStatus.TRIAL:
        # トライアル期限をチェック
        if user.trial_ends_at and datetime.utcnow() > user.trial_ends_at:
            # トライアル期限切れの場合はFREE状態として扱う
            pass
        else:
            # トライアル期間中はすべてのアクティブなコース
            courses = db.query(Course.id).filter(Course.is_active == True).all()
            return [c.id for c in courses]
    
    # FREE状態の場合
    # 無料範囲（DB駆動）
    courses = db.query(Course.id).filter(
        Course.is_active == True,
        Course.is_free == True,
    ).all()

    return [c.id for c in courses]

