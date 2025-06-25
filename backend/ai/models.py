from django.db import models

class AIFeedback(models.Model):
    prompt = models.TextField()
    response = models.TextField()
    rating = models.CharField(max_length=20, choices=[('thumbs_up', 'Thumbs Up'), ('thumbs_down', 'Thumbs Down')])
    regenerated = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    actions_taken = models.JSONField(default=list)
    can_affect_model = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.prompt[:50]}... ({self.rating})"