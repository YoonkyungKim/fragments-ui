// fragments microservice API
const apiUrl = process.env.API_URL;

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
export async function getUserFragments(user) {
    console.log('Requesting user fragments data...');
    try {
        const res = await fetch(`${apiUrl}/v1/fragments`, {
            headers: {
                // Include the user's ID Token in the request so we're authorized
                Authorization: `Bearer ${user.idToken}`,
            },
        });
        if (!res.ok) {
            throw new Error(`{res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log('Got user fragments data', { data });
    } catch (err) {
        console.error('Unable to call GET /v1/fragment', { err });
    }
}