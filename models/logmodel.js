class LogModel {
    constructor(logJson) {
        if(logJson){
            try {
                this.eventTime = logJson.published
                this.severity = logJson.severity
                this.actor = logJson.actor.displayName
                this.outcome = logJson.outcome.result
                this.msg = logJson.displayMessage
            }
            catch(error) {
                console.log(error);
            }
        }
    }
}

module.exports = LogModel