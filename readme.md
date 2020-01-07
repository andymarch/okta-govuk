# Okta with Full Custom UI

While Okta provides a great UI experiance you may require the experiance to be
cusomizer beyond what that product is currently capable of. This demonstration
provides an example using the [gov.uk design system](https://design-system.service.gov.uk/) which is a required UI
experiance for all website operating under the gov.uk domain.


## Demo features

- Alternate login IDs: user's can login with "customer reference number" in
  addition to their email.
- Alternate factor recovery: user's can recover their password with their
  email/customer reference number and their date of birth.
- Password re-authentication: when updating a users profile password
  confirmation is required.
- Access Delegation: Using the [Managed Access
  project](https://github.com/andymarch/okta-managedaccess), users can exercise
  authority delegated to them by an entity.


## Running the demo

### Hosted service

A live instance of this demo is running on Heroku
[here](https://okta-govuk.herokuapp.com/). Self registration is coming soon.

### Deploy your own

#### Application Setup

- (optional) Deploy the Managed Access project if you want authority delegation.
- Clone this repository
- Create a .env file with the following values

```
SESSION_SECRET=<random string>
TENANT_URL=https://<yourtenant>.oktapreview.com
ISSUER=https://<yourtenant>.oktapreview.com/oauth2/<yourauthzserver>
CLIENT_ID=<yourclientid>
CLIENT_SECRET=<yourclientsecret>
REDIRECT_URI=http://localhost:3000/authorization-code/callback

SCOPES=openid profile 
APP_BASE_URL=http://localhost:3000
API_TOKEN=<your token>
TOKEN_AUD=<your Audience>
SERVICE_URL=<your delegation service url>
```

#### Tenant Setup

- Add required profile string attributes for "date_of_birth" and
  "customer_reference_number"
- (Optional) Follow tenant setup for Managed Access.

### UDP

Want to see this demo on UDP? Request it from the UDP team. Until the Okta
Terraform provider supports user types this is unlikely.