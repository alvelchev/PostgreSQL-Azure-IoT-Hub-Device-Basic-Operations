CREATE OR REPLACE FUNCTION public.getregistrationtoken(
	deviceid text,
	florestoken text,
	florestokenexpires bigint
	)
    RETURNS text
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE SECURITY DEFINER 
    
AS $BODY$
DECLARE isvalid boolean;
DECLARE sastoken text;
BEGIN
	
	isvalid := validatetoken(deviceid, florestoken, florestokenexpires);
	
	if isvalid THEN
	
		sastoken := computeregistrationtoken(deviceid);

		return sastoken;
	ELSE
		RAISE EXCEPTION 'Input token is invalid!';
	END IF;

END;
$BODY$;

ALTER FUNCTION public.exchangetoken(text, text, bigint, text)
    OWNER TO postgres;
