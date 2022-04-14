// fragments microservice API
const apiUrl = process.env.API_URL;

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
export async function getUserFragments(user, expand=0) {
  console.log('Requesting user fragments data...');

  try {
    const res = await fetch(`${apiUrl}/v1/fragments?expand=${expand}`, {
      headers: {
        // Include the user's ID Token in the request so we're authorized
        Authorization: `Bearer ${user.idToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    // console.log('Got user fragments data', { data });
    return { data };
  } catch (err) {
    console.error('Unable to call GET /v1/fragments', { err });
  }
}

export async function getFragmentById(user, id, ext='') {
  console.log(`Requesting user fragment data by id ${id}`);
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}${ext}`, {
      headers: {
        // Include the user's ID Token in the request so we're authorized
        Authorization: `Bearer ${user.idToken}`,
      },
    });
    if (!res.ok) {
      console.log(`res.ok is false, ${res.status} ${res.statusText}`);
      throw new Error(`${res.status} ${res.statusText}`);
    }

    console.log('Got fragments data with given id', res);
    console.log('res content type', res.headers.get("content-type"));

    const contentType = res.headers.get('content-type');
    // console.log("get-by-id context type header:" + contentType)
    if (contentType.includes('text/')) {
      try {
        return [res.headers.get("content-type"), await res.text()];
      } catch (e) {
        console.error('cannot return text fragment', { e });
      }
    } else if (contentType.includes('application/json')) {
      try {
        return [res.headers.get("content-type"), await res.json()];
      } catch (e) {
        console.error('cannot return json', { e });
      }      
    }
    // will add more conditions for a3
  } catch (err) {
    console.error('Unable to call GET /v1/fragments/:id', { err });
  }
}

/**
 * Post fragment to the server
 */
export async function postFragment(user, value, contentType) {
  console.log('Post fragment data...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: "POST",
      headers: {
        // Include the user's ID Token in the request so we're authorized
        Authorization: `Bearer ${user.idToken}`,
        'Content-Type': contentType,
      },
      body: value,
    });
    if (!res.ok) {
      throw new Error(`{res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Posted fragments data', { data });
  } catch (err) {
    console.error('Unable to call POST /v1/fragments', { err });
  }
}