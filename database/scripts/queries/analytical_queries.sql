-- Consultas Analíticas - Eu Duvido!
SELECT 
    a.id_aposta,
    a.titulo AS desafio,
    u_desafiado.apelido AS desafiado,
    e.tipo_midia,
    e.url_comprovante,
    COUNT(v.id_voto) AS total_votos,
    SUM(CASE WHEN v.voto = 'VALIDO' THEN 1 ELSE 0 END) AS votos_favoraveis,
    SUM(CASE WHEN v.voto = 'INVALIDO' THEN 1 ELSE 0 END) AS votos_contra,
    ROUND((SUM(CASE WHEN v.voto = 'VALIDO' THEN 1.0 ELSE 0.0 END) / COUNT(v.id_voto)) * 100, 1) AS percentual_aprovacao
FROM aposta a
INNER JOIN evidencia e ON a.id_aposta = e.id_aposta
INNER JOIN usuario u_desafiado ON e.id_usuario = u_desafiado.id_usuario
LEFT JOIN voto_evidencia v ON e.id_evidencia = v.id_evidencia
WHERE a.id_aposta = 1
GROUP BY a.id_aposta, a.titulo, u_desafiado.apelido, e.tipo_midia, e.url_comprovante;
