function showScreen(id){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }
  function setProgress(step){
    const pct = step === 1 ? 33 : step === 2 ? 66 : 100;
    document.getElementById('progressFill').style.width = pct + '%';
    ['label1','label2','label3'].forEach((id,i)=>{
      document.getElementById(id).classList.toggle('on', i < step);
    });
  }
  let currentCategory = null;
  let isSubmitting = false;

  function selectCategory(cat){
    currentCategory = cat;
    document.getElementById('itFields').style.display = cat === 'it' ? 'block' : 'none';
    document.getElementById('techFields').style.display = cat === 'technical' ? 'block' : 'none';
    document.getElementById('formTitle').textContent = cat === 'it' ? "Tell us what's happening" : "Tell us about the fault";
    document.getElementById('formSubtitle').textContent = cat === 'it' ? "Fill in as much detail as you can." : "Include as much detail as you can.";
    showScreen('screen-form');
    setProgress(2);
  }
  function resetForm(){
    document.querySelectorAll('#screen-form input, #screen-form select, #screen-form textarea').forEach(el => {
      if(el.type === 'file'){ el.value = ''; return; }
      el.value = '';
    });
    document.querySelectorAll('#screen-form .field.invalid').forEach(f => f.classList.remove('invalid'));
    hideSubmitError();
  }
  function goToCategory(){
    resetForm();
    currentCategory = null;
    showScreen('screen-category');
    setProgress(1);
  }
  function showSubmitError(message){
    const el = document.getElementById('submitError');
    el.textContent = message;
    el.style.display = 'block';
  }
  function hideSubmitError(){
    const el = document.getElementById('submitError');
    el.textContent = '';
    el.style.display = 'none';
  }
  function collectPayload(){
    const isIT = currentCategory === 'it';
    const scope = document.getElementById(isIT ? 'itFields' : 'techFields');
    return {
      category: isIT ? 'IT' : 'Technical',
      name: document.querySelector('[data-field="name"]').value,
      email: document.querySelector('[data-field="email"]').value,
      dept: document.querySelector('[data-field="dept"]').value,
      issueType: scope.querySelector('[data-field="issueType"]').value,
      details: scope.querySelector('[data-field="details"]').value
    };
  }
  function showConfirmation(ticketRef){
    const refEl = document.getElementById('ticketRef');
    if(ticketRef){
      refEl.textContent = '#' + ticketRef;
      refEl.style.display = 'inline-block';
    } else {
      refEl.style.display = 'none';
    }
    showScreen('screen-confirm');
    setProgress(3);
  }

  function validateForm(){
    let valid = true;
    document.querySelectorAll('#screen-form .field').forEach(field => {
      if(field.offsetParent === null) return; // skip hidden (other category's fields)
      const control = field.querySelector('input,select,textarea');
      if(!control || !control.hasAttribute('required')) return;
      if(!control.checkValidity()){
        field.classList.add('invalid');
        valid = false;
      } else {
        field.classList.remove('invalid');
      }
    });
    return valid;
  }

  document.getElementById('screen-form').addEventListener('input', (e) => {
    const field = e.target.closest('.field');
    if(field) field.classList.remove('invalid');
  });
  document.getElementById('screen-form').addEventListener('change', (e) => {
    const field = e.target.closest('.field');
    if(field) field.classList.remove('invalid');
  });

  async function submitTicket(){
    if(isSubmitting) return;
    hideSubmitError();
    if(!validateForm()){
      const firstInvalid = document.querySelector('#screen-form .field.invalid');
      if(firstInvalid) firstInvalid.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    const btn = document.getElementById('submitBtn');
    isSubmitting = true;
    btn.disabled = true;
    btn.classList.add('is-loading');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/submit-ticket', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(collectPayload()),
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if(!response.ok || !result.success){
        throw new Error(result.error || 'Submission failed');
      }
      showConfirmation(result.ticketRef);
    } catch(err){
      showSubmitError("That didn't go through. Please check your connection and try again. If it keeps happening, let IT know.");
    } finally {
      clearTimeout(timer);
      isSubmitting = false;
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  }

  function setupFileDrop(dropId, fileInputId){
    const drop = document.getElementById(dropId);
    const input = document.getElementById(fileInputId);
    const textEl = drop.querySelector('.file-drop-text');
    const defaultHTML = textEl.innerHTML;
    input.addEventListener('change', () => {
      if(input.files && input.files[0]){
        textEl.textContent = '📎 ' + input.files[0].name;
      } else {
        textEl.innerHTML = defaultHTML;
      }
    });
    ['dragenter','dragover'].forEach(evt => {
      drop.addEventListener(evt, (e) => { e.preventDefault(); drop.classList.add('dragover'); });
    });
    ['dragleave','drop'].forEach(evt => {
      drop.addEventListener(evt, (e) => { e.preventDefault(); drop.classList.remove('dragover'); });
    });
    drop.addEventListener('drop', (e) => {
      if(e.dataTransfer.files && e.dataTransfer.files[0]){
        input.files = e.dataTransfer.files;
        textEl.textContent = '📎 ' + e.dataTransfer.files[0].name;
      }
    });
  }
  setupFileDrop('itFileDrop', 'itFile');
  setupFileDrop('techFileDrop', 'techFile');
