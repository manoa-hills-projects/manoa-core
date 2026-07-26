-- Crear índice FTS5 para búsqueda de texto completo en leyes
CREATE VIRTUAL TABLE IF NOT EXISTS laws_fts USING fts5(
    name,
    full_text,
    tokenize='porter unicode61'
);

-- Poblar el índice con los datos existentes
INSERT INTO laws_fts(name, full_text) SELECT name, full_text FROM laws WHERE NOT EXISTS (SELECT 1 FROM laws_fts LIMIT 1);

-- Triggers para mantener el índice sincronizado
CREATE TRIGGER IF NOT EXISTS laws_fts_ai AFTER INSERT ON laws BEGIN
    INSERT INTO laws_fts(name, full_text) VALUES (new.name, new.full_text);
END;

CREATE TRIGGER IF NOT EXISTS laws_fts_ad AFTER DELETE ON laws BEGIN
    INSERT INTO laws_fts(laws_fts, name, full_text) VALUES('delete', old.name, old.full_text);
END;

CREATE TRIGGER IF NOT EXISTS laws_fts_au AFTER UPDATE ON laws BEGIN
    INSERT INTO laws_fts(laws_fts, name, full_text) VALUES('delete', old.name, old.full_text);
    INSERT INTO laws_fts(name, full_text) VALUES (new.name, new.full_text);
END;
