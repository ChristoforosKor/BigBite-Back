const axios = require('axios');
//const expiringOffset = 300000 ; // 5 minutes
const tokenUrl = 'https://services.anakiklosistospiti.gr/reciget_webapi/api/Token';



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
