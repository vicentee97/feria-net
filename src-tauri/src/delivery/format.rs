//! Helpers para construir el payload de un ticket segun el backend
//! activo.
//!
//! - `format_ticket_for_thermal`: bytes ESC/POS listos para
//!   imprimir en una termica generica (58 mm u 80 mm). Incluye
//!   `ESC @` (init), `ESC a 1` (centrar) y `GS V B 0` (corte
//!   parcial, variante comun). **Sin** QR ni barcode en v1.
//! - `format_ticket_for_file`: texto plano UTF-8 con los campos
//!   basicos del ticket. Util para `FileDelivery` y para debug.
//!
//! Por que el formato vive aqui y no en cada backend:
//! - **Single source of truth**: si cambia el formato del ticket,
//!   se cambia en un solo sitio.
//! - **Testabilidad**: el formato se prueba sin hardware ni
//!   filesystem.
//! - **Registry limpia**: el `DeliveryRegistry` no tiene que saber
//!   como se formatea; solo decide que `format_*` llamar segun el
//!   `DeliveryKind` del backend activo.

use crate::domain::ticket::Ticket;

/// Construye los bytes ESC/POS que representan un ticket para una
/// impresora termica generica.
///
/// El formato es deliberadamente simple y compatible con la
/// mayoria de impresoras ESC/POS de 58 mm / 80 mm:
///
/// ```text
///  [init]      ESC @                 (reset del hardware)
///  [align]     ESC a 1               (centrar)
///  <nombre atraccion>
///  [newline]
///  Ticket #<id>
///  [newline x3]
///  [cut]       GS V B 0              (corte parcial, Epson-style)
/// ```
///
/// Las constantes ESC/POS se escriben como bytes literales para
/// que el resultado sea inspeccionable y no dependa de la
/// representacion intermedia del crate `escpos`.
///
/// **No se anade** QR, barcode, logo ni fuente personalizada en
/// v1. Cualquier extension futura se hace agregando bytes a este
/// payload (no modificando el flujo del command).
pub fn format_ticket_for_thermal(ticket: &Ticket, attraction_name: &str) -> Vec<u8> {
    let mut payload = Vec::with_capacity(128);
    // ESC @ — reset / init de la impresora.
    payload.extend_from_slice(b"\x1B\x40");
    // ESC a 1 — justificar al centro.
    payload.extend_from_slice(b"\x1B\x61\x01");
    // Cabecera: nombre de la atraccion.
    payload.extend_from_slice(attraction_name.as_bytes());
    payload.extend_from_slice(b"\n");
    // ID del ticket.
    payload.extend_from_slice(b"Ticket #");
    payload.extend_from_slice(ticket.id.to_string().as_bytes());
    payload.extend_from_slice(b"\n");
    // Tres saltos de linea para empujar el ticket fuera del
    // cabezal antes del corte.
    payload.extend_from_slice(b"\n\n\n");
    // GS V B 0 — corte parcial. Es la variante que aceptan la
    // mayoria de impresoras Epson y compatibles; las que no lo
    // soportan imprimiran el codigo como un caracter raro pero
    // el resto del ticket sale bien.
    payload.extend_from_slice(b"\x1D\x56\x42\x00");
    payload
}

/// Construye el texto plano (UTF-8) que representa un ticket,
/// adecuado para `FileDelivery` o para inspeccion manual.
///
/// Se devuelve como `Vec<u8>` (no `String`) para mantener la misma
/// firma que `format_ticket_for_thermal`: el backend nunca tiene
/// que hacer conversion de encoding, y el command puede pasar el
/// resultado tal cual a `registry.deliver(ticket_id, payload)`.
pub fn format_ticket_for_file(ticket: &Ticket, attraction_name: &str) -> Vec<u8> {
    let text = format!(
        "FeriaNet Ticket\n\
         Atraccion: {}\n\
         Ticket ID: {}\n\
         Creado: {}\n",
        attraction_name,
        ticket.id,
        ticket.created_at.to_rfc3339(),
    );
    text.into_bytes()
}

// ============================================================
// Tests
// ============================================================

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{TimeZone, Utc};
    use uuid::Uuid;

    fn sample_ticket() -> Ticket {
        Ticket {
            id: Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap(),
            sale_id: Uuid::nil(),
            sale_line_id: Uuid::nil(),
            cash_session_id: Uuid::nil(),
            fair_edition_id: Uuid::nil(),
            attraction_id: Uuid::nil(),
            created_at: Utc.with_ymd_and_hms(2026, 6, 27, 12, 0, 0).unwrap(),
            quantity: 1,
            unit_price_cents: 250,
            total_cents: 250,
        }
    }

    #[test]
    fn thermal_payload_inicia_con_esc_y_termina_con_corte() {
        let ticket = sample_ticket();
        let payload = format_ticket_for_thermal(&ticket, "Camas elasticas");

        // El primer byte debe ser ESC (0x1B) del init.
        assert_eq!(payload[0], 0x1B, "primer byte debe ser ESC (0x1B)");
        // El segundo byte del init es '@' (0x40).
        assert_eq!(payload[1], 0x40, "segundo byte del init debe ser '@'");

        // El payload debe terminar con el corte parcial GS V B 0.
        let last_four = &payload[payload.len() - 4..];
        assert_eq!(last_four, b"\x1D\x56\x42\x00", "debe terminar con GS V B 0");
    }

    #[test]
    fn thermal_payload_incluye_nombre_y_id() {
        let ticket = sample_ticket();
        let payload = format_ticket_for_thermal(&ticket, "Camas elasticas");

        let as_str = std::str::from_utf8(&payload).expect("payload debe ser UTF-8 valido");
        assert!(as_str.contains("Camas elasticas"));
        assert!(as_str.contains("Ticket #"));
        assert!(as_str.contains("00000000-0000-0000-0000-000000000001"));
    }

    #[test]
    fn file_payload_contiene_campos_basicos() {
        let ticket = sample_ticket();
        let payload = format_ticket_for_file(&ticket, "Camas elasticas");
        let as_str = std::str::from_utf8(&payload).expect("payload debe ser UTF-8 valido");
        assert!(as_str.contains("FeriaNet Ticket"));
        assert!(as_str.contains("Atraccion: Camas elasticas"));
        assert!(as_str.contains("Ticket ID: 00000000-0000-0000-0000-000000000001"));
        assert!(as_str.contains("Creado: 2026-06-27"));
    }
}
