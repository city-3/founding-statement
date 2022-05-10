require('dotenv').config()

const { publishStatement } = require('../pages/api/_arweave')

const transaction = publishStatement(JSON.stringify({
  statement: `We believe that in order to achieve a more prosperous, just, and regenerative world, we need to move beyond our current extractive systems of financial, social, and governmental organization.

We intend to build living systems for human flourishing, capable of helping our residents and ​​businesses thrive, keeping our communities safe, and housing our neighbors.

We envision a future where community residents steward Oakland’s wealth - land, housing, culture, and businesses - towards collective prosperity.

We see crypto as a tool capable of powering our transition to a just economy and are excited to leverage it to build better systems.

Together, we can take the wellbeing of our community directly into our own hands, bringing about a more collaborative, abundant, and empowered society.`
}))