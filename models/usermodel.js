var atob = require('atob');

class UserModel {
    constructor(context) {
        if(context.userinfo || context.tokens){
            this.sub = context.userinfo.sub
            this.givenName = context.userinfo.given_name
            this.family_name = context.userinfo.family_name
            this.idToken = context.tokens.id_token

            this.isEntity = false
            if(this.idToken){
                var base64 = this.idToken.split('.')[1];
                var decoded = JSON.parse(atob(base64))
                if(decoded.entityName || decoded.entityId){
                    this.isEntity = true
                    this.entityId = decoded.entityId
                    this.entityName = decoded.entityName
                }
            }
        }
    }
}

module.exports = UserModel