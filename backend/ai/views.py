from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import AIFeedbackSerializer
from rest_framework.permissions import IsAuthenticated

class AIFeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AIFeedbackSerializer(data=request.data)
        if serializer.is_valid():
            feedback = serializer.save(
                user=request.user,
                can_affect_model=getattr(request.user, 'allow_feedback_to_train_model', False)
            )
            return Response({"message": "Feedback saved."}, status=201)
        return Response(serializer.errors, status=400)
