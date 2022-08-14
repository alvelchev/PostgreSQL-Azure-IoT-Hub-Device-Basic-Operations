CREATE OR REPLACE FUNCTION public.exchangetoken(
	deviceid text,
	florestoken text,
	florestokenexpires bigint,
	iothub text)
    RETURNS text
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE SECURITY DEFINER 
    
AS $BODY$
DECLARE	retVal text;
DECLARE isvalid boolean;
DECLARE sastoken text;
BEGIN
	
	isvalid := validatetoken(deviceid, florestoken, florestokenexpires);
	
	if isvalid THEN
	
		sastoken := gettokenex(deviceid,iothub);
		return sastoken;

	ELSE

		RAISE EXCEPTION 'Input token is invalid!';

	END IF;

END;
$BODY$;
