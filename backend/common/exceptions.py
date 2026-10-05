from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

class AppException(Exception):
    """Base application exception for business logic errors."""
    default_code = "APPLICATION_ERROR"
    default_message = "An error occurred."
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, message=None, code=None, details=None, status_code=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        self.details = details or {}
        if status_code:
            self.status_code = status_code
        super().__init__(self.message)

class ValidationError(AppException):
    default_code = "VALIDATION_ERROR"
    default_message = "Validation failed."
    status_code = status.HTTP_400_BAD_REQUEST

class TruthfulnessViolationError(AppException):
    default_code = "TRUTHFULNESS_VIOLATION"
    default_message = "Generated resume content violates the truthfulness contract."
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

def custom_exception_handler(exc, context):
    """
    Standardize all exception responses to:
    {
      "error": {
        "code": "...",
        "message": "...",
        "details": {}
      }
    }
    """
    if isinstance(exc, AppException):
        return Response(
            {
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
            status=exc.status_code,
        )

    response = exception_handler(exc, context)

    if response is not None:
        code = getattr(exc, 'default_code', 'API_ERROR')
        message = "An error occurred while processing the request."
        details = response.data

        if isinstance(response.data, dict):
            if 'detail' in response.data:
                message = str(response.data['detail'])
                details = {k: v for k, v in response.data.items() if k != 'detail'}
        elif isinstance(response.data, list):
            message = "; ".join(str(item) for item in response.data)

        response.data = {
            "error": {
                "code": str(code).upper(),
                "message": message,
                "details": details,
            }
        }
        return response

    logger.exception("Unhandled server exception: %s", exc)
    return Response(
        {
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
                "details": str(exc) if context.get('request') and context['request'].user.is_staff else {},
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
