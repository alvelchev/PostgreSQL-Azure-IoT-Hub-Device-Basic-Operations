CREATE OR REPLACE FUNCTION public.gettokenex(
	deviceid text,
	iothub text)
    RETURNS text
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE SECURITY DEFINER 
    
AS $BODY$
DECLARE	retVal text;
DECLARE proxykey text;
DECLARE devicekey text;
DECLARE deviceuri text;
DECLARE payload text;
DECLARE expires int;
DECLARE signature text;

BEGIN
	SELECT (keys.pskkey) INTO STRICT proxykey
	FROM keys
	WHERE keys.deviceId = 'proxy';
	
	
	SELECT EXTRACT(epoch FROM CURRENT_TIMESTAMP(0)) INTO expires;
	
	expires = expires + 3600;
	
	deviceuri = CONCAT(iotHub,'.azure-devices.net%2Fdevices%2F',deviceId);
	payload = CONCAT(deviceuri,E'\n',expires);
	
	devicekey = encode(
					hmac(
						deviceid::bytea,
						decode(proxykey,'BASE64')
						,'sha256'
					)
				,'base64');
			
	
	signature = replace(urlencode(encode(hmac(payload::bytea,decode(devicekey,'BASE64'),'sha256'),'base64')),'/','%2F');
	
	retVal = CONCAT('SharedAccessSignature sr=',deviceuri,'&sig=',signature,'&se=',expires);
	
	RETURN retVal;

EXCEPTION
	WHEN NO_DATA_FOUND THEN
		RAISE EXCEPTION 'No device found with id %.', $1;
	WHEN TOO_MANY_ROWS THEN
		RAISE EXCEPTION 'data integrity error - contact support';

END;
$BODY$;
