from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import Organization

User = get_user_model()

class AIFeedback(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ai_feedback',
        null=True, blank=True,
    )
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='ai_feedback',
        help_text="Organization this feedback belongs to",
        null=True, blank=True,
    )
    prompt = models.TextField()
    response = models.TextField()
    rating = models.CharField(max_length=20, choices=[('thumbs_up', 'Thumbs Up'), ('thumbs_down', 'Thumbs Down')])
    regenerated = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    actions_taken = models.JSONField(default=list)
    can_affect_model = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def save(self, *args, **kwargs):
        # Auto-assign org from user if not set
        if not self.org and self.user and self.user.org:
            self.org = self.user.org
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.prompt[:50]}... ({self.rating}) - {self.org.name}"