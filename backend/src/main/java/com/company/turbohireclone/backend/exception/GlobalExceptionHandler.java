package com.company.turbohireclone.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PortalException.class)
    public ResponseEntity<?> handlePortalException(PortalException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error", ex.getMessage(),
                        "message", getMessage(ex.getMessage())
                ));
    }


    private String getMessage(String code) {
        return switch (code) {
            case "INVALID_TOKEN" -> "Invalid candidate portal link.";
            case "ACCESS_BLOCKED" -> "Portal access blocked due to multiple failed attempts.";
            case "TOKEN_EXPIRED" -> "This candidate portal link has expired.";
            default -> "Portal error occurred.";
        };
    }
}