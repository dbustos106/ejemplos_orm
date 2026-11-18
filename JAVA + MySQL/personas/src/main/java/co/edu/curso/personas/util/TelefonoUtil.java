package co.edu.curso.personas.util;

public final class TelefonoUtil {

    private TelefonoUtil() {}

    // "300 123-4567" -> "3001234567"
    public static String normalizar(String numero) {
        return numero.replaceAll("[\\s\\-()]", "");
    }

}
