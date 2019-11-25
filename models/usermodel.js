class UserModel {
    constructor(context) {
        if(context){
            this.sub = context.userinfo.sub
            this.givenName = context.userinfo.given_name
            this.family_name = context.userinfo.family_name
            this.idToken = context.tokens.id_token
        }
    }
}

module.exports = UserModel