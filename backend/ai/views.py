from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import AIFeedbackSerializer
from accounts.permissions import IsReadOnlyOrAbove
from accounts.mixins import CombinedOrgMixin

class AIFeedbackView(CombinedOrgMixin, APIView):
    permission_classes = [IsReadOnlyOrAbove]

    def post(self, request):
        serializer = AIFeedbackSerializer(data=request.data)
        if serializer.is_valid():
            feedback = serializer.save(
                user=request.user,
                org=request.user.org,
                can_affect_model=getattr(request.user, 'allow_feedback_to_train_model', False)
            )
            return Response({"message": "Feedback saved."}, status=201)
        return Response(serializer.errors, status=400)
