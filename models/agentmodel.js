class AgentModel {
    constructor(profileJson) {
        if(profileJson){
            try {
                this.id = profileJson.id
                this.firstName = profileJson.profile.firstName
                this.secondName = profileJson.profile.lastName
                this.login = profileJson.profile.login
                this.email = profileJson.profile.email
                this.organization = profileJson.profile.organization
            }
            catch (error){
                console.log(error)
            }
        }
    }
}

module.exports = AgentModel