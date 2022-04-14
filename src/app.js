import { Auth, getUser } from './auth';
import { getUserFragments, getFragmentById, postFragment } from './api';

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

  document.getElementById('types').addEventListener('change', function(e) {
    // console.log('You selected: ', this.value);
    e.preventDefault();
    selectedType = e.target.value;
    console.log('selected type: ' + selectedType);

    if (selectedType !== 'text/plain') {
      textFormSection.style.display="none";
    } else {
      textFormSection.style.display="inline-block";
    }
    handleConvertTypeFormOptions();
  });

  let selectedType = 'text/plain';
  
  var textForm = document.getElementById("textForm");
  
  textForm.addEventListener("submit", handleTextForm);   
 

  async function handleTextForm(e) {
    e.preventDefault();
    try {
      console.log("input in index.html: " + document.getElementById("textFragment").value);
      // console.log("selected type: " + selectedType);

      await postFragment(user, document.getElementById("textFragment").value, 'text/plain');
      
      //expanded
      const fragments = await getUserFragments(user, 1);

      //use the most recently added fragment's id
      if (fragments && fragments !== undefined) {
        await fragments.data.fragments.sort(function(a,b){
          return new Date(b.created) - new Date(a.created);
        });
        const res = await getFragmentById(user, fragments.data.fragments[0].id);
        document.querySelector('.fragment').innerText = res[1];
      }
    } catch (e) {
      console.log(e);
    }
  }

  handleConvertTypeFormOptions();

  function handleConvertTypeFormOptions() {
    document.querySelectorAll("#convertTypes option").forEach(opt => {
      if (opt.value !== 'noConversion') {
        if (selectedType && selectedType.includes('text/markdown')) {
          if (opt.value !== '.html') {
            opt.disabled = true;
          } else {
            opt.disabled = false;
          }
        } else {
          opt.disabled = true;
        }
      } else {
        opt.disabled = false;
      }
    });
  }

  const inputEl = document.getElementById('inputFile');
  inputEl?.addEventListener('change', handleFile);
  // inputEl.addEventListener('change', handleFile);

  function handleFile(evt) {
    const files = evt.target.files; // FileList object
    const f = files[0];
    const reader = new FileReader();

    // for a2, only support md -> html conversion.
    async function handleConvertTypeForm(e, fragments) {
      let res;
      e.preventDefault();
      const selectedConversionType = document.getElementById('convertTypes').value;
      try {
        await fragments.data.fragments.sort(function(a,b){
          return new Date(b.created) - new Date(a.created);
        });
        if (selectedConversionType === 'noConversion') {
          //use the most recently added fragment's id
          res = await getFragmentById(user, fragments.data.fragments[0].id);
        } else {
          console.log('selected conversion extension: ' + document.getElementById('convertTypes').value);
          res = await getFragmentById(user, fragments.data.fragments[0].id, selectedConversionType);
        }
        document.querySelector('.fragment').innerText = typeof res[1] === 'object' ? JSON.stringify(res[1]) : res[1];
      } catch (e) {
        console.error("Get by id failed after post through file: " + e);
        document.querySelector('.fragment').innerText = 'Get by id failed. Please check the file content uploaded.';
      }
    }

    // Capture the file information.
    reader.onload = (function() {
      return async function(e) {
        console.log("uploaded file type: " + f.type);
 
        if (selectedType && selectedType !== f.type) {
          alert('Uploaded file type must be same as selected type.');
        } else {
          await postFragment(user, e.target.result, f.type);
        }

        const fragments = await getUserFragments(user, 1);
        if (fragments && fragments !== undefined) {
          handleConvertTypeFormOptions();

          var convertTypeForm = document.getElementById("convertTypeform");
          convertTypeForm.addEventListener("submit", (e) => handleConvertTypeForm(e, fragments)); 
        }
      };
    })(f);

    reader.readAsText(f);
  }
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);