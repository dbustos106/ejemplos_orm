DELIMITER $$

DROP PROCEDURE IF EXISTS sp_contar_telefonos$$

CREATE PROCEDURE sp_contar_telefonos(IN p_persona_id BIGINT, OUT p_total INT)
READS SQL DATA
BEGIN
    SELECT COUNT(*) INTO p_total
    FROM telefono
    WHERE persona_id = p_persona_id;
END$$

DELIMITER ;