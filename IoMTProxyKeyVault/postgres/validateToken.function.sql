CREATE OR REPLACE FUNCTION public.validatetoken(
	deviceid text,
	florestoken text,
	florestokenexpires bigint)
    RETURNS boolean
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE SECURITY DEFINER 
    
AS $BODY$
DECLARE	retVal text;
DECLARE thekey text;
DECLARE deviceuri text;
DECLARE payload text;
DECLARE signature text;

BEGIN

	SELECT (keys.pskkey) INTO STRICT thekey
	FROM keys
	WHERE keys.deviceId = 'flores';
	payload = CONCAT(deviceId,E'\n',florestokenexpires);
	
	signature = encode(hmac(payload::bytea,thekey::bytea,'sha256'),'base64');

	retVal = (signature = floresToken);
	
	RETURN retVal;

EXCEPTION
	WHEN NO_DATA_FOUND THEN
		RAISE EXCEPTION 'No device found with id %.', $1;
	WHEN TOO_MANY_ROWS THEN
		RAISE EXCEPTION 'data integrity error - contact support';

END;
$BODY$;
