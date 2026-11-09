package com.duoc.aquachile_backend.common;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

/**
 * Convierte las excepciones en respuestas JSON con el codigo HTTP correcto.
 * Se responde directamente (sin sendError) para que Spring Security no reemplace el codigo por un 401.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiError> estado(ResponseStatusException ex) {
        return responder(HttpStatus.valueOf(ex.getStatusCode().value()), ex.getReason(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validacion(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            campos.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return responder(HttpStatus.BAD_REQUEST, "Hay campos invalidos", campos);
    }

    /** Formularios (multipart) que fallan al validarse. */
    @ExceptionHandler(BindException.class)
    ResponseEntity<ApiError> formulario(BindException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            campos.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return responder(HttpStatus.BAD_REQUEST, "Hay campos invalidos", campos);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> cuerpoIlegible(HttpMessageNotReadableException ex) {
        return responder(HttpStatus.BAD_REQUEST, "El cuerpo de la peticion no es un JSON valido", null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiError> tipoInvalido(MethodArgumentTypeMismatchException ex) {
        return responder(HttpStatus.BAD_REQUEST, "Valor invalido para el parametro '" + ex.getName() + "'", null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> archivoGrande(MaxUploadSizeExceededException ex) {
        return responder(HttpStatus.PAYLOAD_TOO_LARGE, "El archivo supera el tamano maximo permitido (5 MB)", null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> integridad(DataIntegrityViolationException ex) {
        return responder(HttpStatus.CONFLICT, "La operacion viola una restriccion de la base de datos", null);
    }

    private ResponseEntity<ApiError> responder(HttpStatus status, String mensaje, Map<String, String> campos) {
        ApiError body = new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), mensaje, campos);
        return ResponseEntity.status(status).body(body);
    }
}
