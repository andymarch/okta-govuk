class EntityModel {
    constructor(profileJson) {
        if(profileJson){
            try {
                this.id = profileJson.id
                this.entityName = profileJson.profile.entityName
                this.entityId = profileJson.profile.entityId
            }
            catch (error){
                console.log(error)
            }
        }
    }
}

module.exports = EntityModel