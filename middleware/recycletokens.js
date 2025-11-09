const axios = require('axios');
//const expiringOffset = 300000 ; // 5 minutes
const tokenUrl = 'https://recigetwebapi-dev.azurewebsites.net/api/Token';



class Tokens {
    constructor() {
        this.tokens = {};
    }

    getTokens() {
        return this.tokens;
    }

    getTokensCount() {
        return Object.keys(this.tokens).length;
    }

    async getValidToken(access_token, userName, password) {

        if (this.isTokenValid(access_token)) {
            return access_token;
        }
        try {
            const response = await this.requestNewToken(userName, password);
//            if (response.status && response.status === 200) {
                return response;
//            }
        } catch (error) {
            throw error;
        }
    }

    emptyTokens() {
        this.tokens = {};
    }

    findToken(access_token) {
        return (this.tokens[access_token] === 'undefined') ? '' : this.tokens[access_token];

    }

    removeToken(access_token) {
        delete(this.getTokens()[access_token]);
    }

    putToken(token) {
        this.tokens[token.access_token] = token;
    }

    isTokenExpired(token) {
        if (token === null) true;
        const expiringDate = new Date(token['.expires']);
        if ((new Date() - expiringDate) > 0) {
            return true;
        }
        return false;
    }

    isTokenValid(access_token) {
        if (access_token === '' || access_token === null)
            return false;
        const foundToken = this.findToken(access_token);
        if (!foundToken) return false;
        if (this.isTokenExpired(foundToken)) {
            this.removeToken(access_token);
            return false;
        }
        return true;
    }

    async requestNewToken(userName, password)
    {
        try {
            const result = await axios.post(
                    tokenUrl, {
                        grant_type: "password",
                        username: userName, //"worker1@vvv.gr",
                        password: password //"worker1"
                    },
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });
                return result;
        } catch (error) {
            return error;
        }
    }
}



class TokensInstance {
    constructor() {

        if (!TokensInstance.instance) {
            TokensInstance.instance = new Tokens();
        }
    }

    getInstance() {
        return TokensInstance.instance;
    }

}

const tokensInstance = new TokensInstance();
const instance = tokensInstance.getInstance();

module.exports = instance;




/*
 * php codes
 * 
 * 
 *      $url = $_ENV['postDataUrl'];^M
 $content = array("bulkMobileCouponBindingModel" => array($data), "isCollectionCompleted" => "false");^M
 //        var_dump(json_encode($content));^M
 $curl = curl_init($url);^M
 //            $authorization = "Authorization: Bearer ". $this->getToken();^M
 $authorization = "Authorization: Bearer " . $this->getToken();^M
 curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type: application/json', $authorization));^M
 curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);^M
 curl_setopt($curl, CURLOPT_POST, true);^M
 curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($content));^M
 ^M
 curl_exec($curl);^M
 
 
 
 ./getData.php:// https://www.mongodb.com/docs/drivers/php/
 ./getAuthCode.php:            'http' => array(
 ./getAuthCode.php:                'content' => http_build_query($data)
 ./.env:urlToken=https://recigetwebapi-dev.azurewebsites.net/api/Token
 ./.env:postDataUrl=https://recigetwebapi-dev.azurewebsites.net/api/Reciget/BulkWorkerScan
 
 * 
 * 
 * 
 * 
 * 
 * class getAuthCode{
 public function getAuthCode(): string{
 
 $dotenv = Dotenv::createImmutable(__DIR__);
 $dotenv->load();
 
 $url = $_ENV['urlToken'];
 $data = array("grant_type"=>$_ENV['grant_type'], "username"=>$_ENV['username'], "password"=>$_ENV['password']);
 
 
 $options = array(
 'http' => array(
 'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
 'method'  => 'POST',
 'content' => http_build_query($data)
 )
 );
 
 $context  = stream_context_create($options);
 $result = file_get_contents($url, false, $context);
 $resObj = json_decode($result);
 return $resObj->access_token;
 }
 
 public function saveToken(string $token):void{
 $tokenFile = fopen("/var/www/recyclebin/cli/sendData/token", "w");
 fwrite($tokenFile, $token);
 fclose($tokenFile);
 }
 
 
 
 }
 $tokenWorker = new getAuthCode();
 $tokenWorker->saveToken($tokenWorker->getAuthCode());
 
 
 
 
 
 
 
 
 urlToken=https://recigetwebapi-dev.azurewebsites.net/api/Token^M
 grant_type=password^M
 username=worker1@vvv.gr^M
 password=worker1^M
 mongodbURL=mongodb://192.168.10.193:27017/^M
 postDataUrl=https://recigetwebapi-dev.azurewebsites.net/api/Reciget/BulkWorkerScan^M
 mqttUname=username^M
 mqttPassword=password^M
 mqttServer=recyclebin.mnss.eu
 ~                                                                                                                                                                                                                                                                                         
 ~                                                                                                                                                                                                                                                                                         
 ~                                     
 
 * 
 * 
 */