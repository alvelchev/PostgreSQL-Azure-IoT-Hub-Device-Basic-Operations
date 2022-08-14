CREATE OR REPLACE FUNCTION public.computeregistrationtoken(
	deviceid text)
    RETURNS text
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE SECURITY DEFINER 
    
AS $BODY$
DECLARE	retVal text;
DECLARE proxykey text;
DECLARE idscope text;
DECLARE reguri text;
DECLARE payload text;
DECLARE expires int;
DECLARE signature text;
DECLARE devicekey text;

BEGIN
	SELECT (keys.pskkey) INTO STRICT proxykey
	FROM keys
	WHERE keys.deviceId = 'proxy';
	
	SELECT (keys.pskkey) INTO STRICT idscope
	FROM keys
	WHERE keys.deviceId = 'idscope';
	
	SELECT EXTRACT(epoch FROM CURRENT_TIMESTAMP(0)) INTO expires;
	
	expires = expires + 3600;
	
	reguri = CONCAT(idscope,'/registrations/',deviceid);
	payload = CONCAT(reguri,E'\n',expires);
	
	devicekey = encode(hmac(deviceid::bytea,decode(proxykey,'BASE64'),'sha256'),'base64');
	
	signature = replace(urlencode(encode(hmac(payload::bytea,decode(devicekey,'BASE64'),'sha256'),'base64')),'/','%2F');
	
	retVal = CONCAT('SharedAccessSignature sr=',reguri,'&sig=',signature,'&skn=registration&se=',expires);
	
	RETURN retVal;

EXCEPTION
	WHEN NO_DATA_FOUND THEN
		RAISE EXCEPTION 'No device found with id %.', $1;
	WHEN TOO_MANY_ROWS THEN
		RAISE EXCEPTION 'data integrity error - contact support';

END;
$BODY$;

ALTER FUNCTION public.computeregistrationtoken(text)
    OWNER TO postgres;
