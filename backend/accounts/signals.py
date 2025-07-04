from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from accounts.models import OnboardingProgress
from accounts.models import CustomUser

@receiver(post_save, sender=CustomUser)
def create_onboarding_progress(sender, instance, created, **kwargs):
    if created:
        OnboardingProgress.objects.get_or_create(user=instance)
