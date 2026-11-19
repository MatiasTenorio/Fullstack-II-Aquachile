package com.duoc.aquachile_backend.googlecalendar;

import static java.nio.charset.StandardCharsets.UTF_8;

import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Cifra los refresh tokens de Google antes de guardarlos en la base de datos (AES-256-GCM).
 * La clave se deriva de app.jwt.secret: si ese secreto cambia, los tokens guardados dejan de
 * poder leerse y cada evaluador debe volver a conectar su cuenta.
 */
@Component
public class CifradorTokens {

    private static final int LARGO_IV = 12;
    private static final int BITS_ETIQUETA = 128;

    private final SecretKeySpec clave;
    private final SecureRandom random = new SecureRandom();

    public CifradorTokens(@Value("${app.jwt.secret}") String secreto) throws GeneralSecurityException {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(("google-tokens:" + secreto).getBytes(UTF_8));
        this.clave = new SecretKeySpec(hash, "AES");
    }

    public String cifrar(String texto) {
        try {
            byte[] iv = new byte[LARGO_IV];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, clave, new GCMParameterSpec(BITS_ETIQUETA, iv));
            byte[] cifrado = cipher.doFinal(texto.getBytes(UTF_8));
            return Base64.getEncoder().encodeToString(
                    ByteBuffer.allocate(iv.length + cifrado.length).put(iv).put(cifrado).array());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo cifrar el token", e);
        }
    }

    public String descifrar(String cifradoBase64) {
        try {
            byte[] datos = Base64.getDecoder().decode(cifradoBase64);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, clave, new GCMParameterSpec(BITS_ETIQUETA, datos, 0, LARGO_IV));
            return new String(cipher.doFinal(datos, LARGO_IV, datos.length - LARGO_IV), UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("No se pudo descifrar el token", e);
        }
    }
}
