CREATE TABLE public.keys
(
    id integer NOT NULL DEFAULT nextval('keys_id_seq'::regclass),
    deviceid character varying COLLATE pg_catalog."default" NOT NULL,
    pskkey character varying COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT keys_pk PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE public.keys
    OWNER to postgres;

GRANT ALL ON TABLE public.keys TO postgres;
-- Index: keys_id_idx

-- DROP INDEX public.keys_id_idx;

CREATE UNIQUE INDEX keys_id_idx
    ON public.keys USING btree
    (id ASC NULLS LAST)
    TABLESPACE pg_default;