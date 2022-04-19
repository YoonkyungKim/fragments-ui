import { Auth, getUser } from './auth';
import { getUserFragments, getFragmentById, postFragment, updateFragment, deleteFragment } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#identity-pool-federation
    Auth.federatedSignIn();
  };

  logoutBtn.onclick = () => {
    // Sign-out of the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/emailpassword/q/platform/js/#sign-out
    Auth.signOut();
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();
  if (!user) {
    // Disable the Logout button
    logoutBtn.disabled = true;
    return;
  }

  // Log the user info for debugging purposes
  console.log({ user });

  const expandedFragments = await getUserFragments(user, 1);
  console.log('Got user fragments data', expandedFragments );

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;  
  
  // Disable the Login button
  loginBtn.disabled = true;

  const textFormSection = document.querySelector('#textFormSection');
  const existingFragmentsSection = document.querySelector('#existingFragmentsSection');
  const selectTypeSection = document.querySelector('#type');
  const fileImportSection = document.querySelector('#fileImport');
  const convertTypeFormSection = document.querySelector('#convertType');

  const convertTypeForm = document.getElementById('convertTypeForm');
  const img = document.getElementById('imageFragment');
  const deleteBtn = document.getElementById('deleteBtn');
  const fragmentToDisplay = document.querySelector('.fragment');

  // default feature is create
  let selectedFeature = 'create';
  // selected fragment for update
  let selectedFragment = {};
  let selectedType = 'text/plain';

  // select what to do: create/update/delete
  document.getElementById('features').addEventListener('change', async function(e) {
    // console.log('You selected: ', this.value);
    e.preventDefault();
    selectedFeature = e.target.value;
    console.log('selected feature: ' + selectedFeature);

    fragmentToDisplay.innerHTML = '';
    if (selectedFeature === 'view') {
      convertTypeFormSection.style.display = 'inline-block';
    } else {
      convertTypeFormSection.style.display = 'none';
    }

    if (selectedFeature === 'delete') {
      deleteBtn.style.display = 'inline-block';
    } else {
      deleteBtn.style.display = 'none';
    }

    if (selectedFeature !== 'create') {
      const fragments = await getUserFragments(user, 1);
      document.getElementById('existingFragmentsLbl').innerText = `Choose a fragment to ${selectedFeature}`;
      
      console.log(fragments);
      removeFragmentsOptions();
      // fill the options to select existing fragment to view/update/delete
      await fillFragmentsOptions(fragments.data.fragments);
      existingFragmentsSection.style.display='inline-block';
      selectTypeSection.style.display='none';
      textFormSection.style.display='none';

      if (selectedFeature === 'update') {
        fileImportSection.style.display='block';
        document.getElementById('textFormSubmitBtn').value = `${selectedFeature} a fragment`;
      } else {
        fileImportSection.style.display='none';
      }
    } else {
      existingFragmentsSection.style.display='none';
      textFormSection.style.display='block';
      selectTypeSection.style.display='block';
      fileImportSection.style.display='block';
    }
  });

  deleteBtn.onclick = async () => {
    try {
      const deleted = await deleteFragment(user, selectedFragment.id);
      if (deleted.status === 'ok') {
        fragmentToDisplay.innerHTML = `Fragment with id: ${selectedFragment.id} has been successfully deleted.`;
      }
      
    } catch (e) {
      console.log(e);
    }
  }

  // fill the options to select existing fragment to view/update/delete
  function fillFragmentsOptions(fragments) {
    const select = document.getElementById('existingFragments');
    for (let i=0; i<fragments.length; i++) {
      const option = new Option();
      option.value = JSON.stringify({id: fragments[i].id, type: fragments[i].type});
      option.text = `${fragments[i].id}, ${fragments[i].type}`;
      select.appendChild(option);
    }
  }

  // remove fragments options
  function removeFragmentsOptions() {
    const select = document.getElementById('existingFragments');
    while (select.lastChild.id !== 'default') {
      select.removeChild(select.lastChild);
    }
  }
  
  // event handler when user selects an existing fragment
  document.getElementById('existingFragments').addEventListener('change', function(e) {
    e.preventDefault();
    if (e.target.value === 'Select a fragment') {
      fragmentToDisplay.innerHTML = 'Please select a fragment';
    } else {
      // console.log(JSON.parse(e.target.value));
      selectedFragment = JSON.parse(e.target.value);
      const selectedFragmentId = selectedFragment.id;
      selectedType = selectedFragment.type;
      console.log('selected fragment: ' + selectedFragmentId);

      if (selectedType !== 'text/plain') {
        textFormSection.style.display='none';
      } else {
        if (selectedFeature === 'update') {
          textFormSection.style.display='inline-block';
        }
      }
    }
  });

  // event handler when user selects to create fragment
  document.getElementById('types').addEventListener('change', function(e) {
    e.preventDefault();
    selectedType = e.target.value;
    console.log('selected type: ' + selectedType);

    if (selectedType !== 'text/plain') {
      textFormSection.style.display='none';
    } else {
      textFormSection.style.display='inline-block';
    }
  });
  
  // to reduce duplicate code.. (when dealing with textForm and file upload)
  async function create(inputData, type) {
    try {
      const fragment = await postFragment(user, inputData, type);
      if (fragment) {
        fragmentToDisplay.innerHTML =  `Fragment of type ${fragment.fragment.type} with id: ${fragment.fragment.id} is created!`;
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function update(inputData, type, id) {
    try {
      const fragment = await updateFragment(user, inputData, id, type);
      if (fragment) {
        fragmentToDisplay.innerHTML =  `Fragment of type ${fragment.fragment.type} with id: ${fragment.fragment.id} is updated!`;
      }
    } catch (e) {
      console.log(e);
    }
  }
  
  var textForm = document.getElementById('textForm');
  
  textForm.addEventListener('submit', handleTextForm);   
 
  async function handleTextForm(e) {
    e.preventDefault();
    // console.log("input in index.html: " + document.getElementById("textFragment").value);
    console.log('selected feature: ' + selectedFeature);
    if (selectedFeature === 'create') {
      create(document.getElementById('textFragment').value, 'text/plain');
    } else {
      update(document.getElementById('textFragment').value, selectedFragment.id, 'text/plain');
    }
  }

  async function displayFragment(id, selectedConversionType) {
    try {
      // delete fragment displayed before
      while (fragmentToDisplay.firstChild) {
        fragmentToDisplay.removeChild(fragmentToDisplay.firstChild);
      }
      fragmentToDisplay.innerText = '';
      img.src = '';

      const { contentType, data } = await getFragmentById(user, id, selectedConversionType);
      
      if (contentType.startsWith('image/')) {
        img.src = URL.createObjectURL(data);  
      } else if (contentType.startsWith('text/html')) {
        fragmentToDisplay.insertAdjacentHTML('afterbegin',data);
      } else {
        fragmentToDisplay.innerText = typeof data === 'object' ? JSON.stringify(data) : data;
      }
    } catch (e) {
      console.error('Get by id failed after post through file: ', { e });
      fragmentToDisplay.innerText = e;
    }
  }

  convertTypeForm.addEventListener('submit', (e) => handleConvertTypeForm(e));

  // for a2, only support md -> html conversion.
  async function handleConvertTypeForm(e, id) {
    e.preventDefault();
    fragmentToDisplay.innerText = '';
    const selectedConversionType = document.getElementById('convertTypes').value;
    let fragmentId;
    if (selectedFeature === 'view') {
      fragmentId = selectedFragment.id;
    } else {
      fragmentId = id;
    }
    console.log('selected feature:' + selectedFeature);
    console.log('id:' + fragmentId);
    console.log('selected conversion extension: ' + document.getElementById('convertTypes').value);
    //use the most recently added fragment's id
    displayFragment(fragmentId, selectedConversionType);
  }

  const inputEl = document.getElementById('inputFile');
  inputEl?.addEventListener('change', handleFile);

  function handleFile(evt) {
    const files = evt.target.files; // FileList object
    const f = files[0];
    const reader = new FileReader();    
    fragmentToDisplay.innerText = '';

    // Capture the file information
    reader.onload = (function() {
      return async function(e) {
        console.log('uploaded file type: ' + f.type);
 
        if (selectedType && selectedType !== f.type) {
          alert('Uploaded file type must be same as selected type.');
        } else {
          console.log('selected feature: ' + selectedFeature);
          if (selectedFeature === 'create') {
            create(e.target.result, f.type);
          } else {
            update(e.target.result, f.type, selectedFragment.id);
          }
        }
      };
    })(f);

    reader.readAsArrayBuffer(f);
  }
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);