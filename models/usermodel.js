var atob = require('atob');

class UserModel {
    constructor(context) {
        if(context.userinfo || context.tokens){
            this.sub = context.userinfo.sub
            this.givenName = context.userinfo.given_name
            this.familyName = context.userinfo.family_name
            this.idToken = context.tokens.id_token
            if(this.idToken){
                var base64 = this.idToken.split('.')[1];
                var decoded = JSON.parse(atob(base64))
                this.userType = decoded.user_type
                if(decoded.entityId){
                    this.entityName = decoded.entity_name
                }
            }

            if(context.tokens.access_token){
                var base64 = context.tokens.access_token.split('.')[1];
                var decoded = JSON.parse(atob(base64))
                this.canDelegate = decoded.can_delegate
            }
        }
    }
}

module.exports = UserModel