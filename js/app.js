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
      if(el.type === 'file'){ el.value = ''; el.dispatchEvent(new Event('change')); return; }
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

      const value = control.value.trim();
      const minLength = Number(control.dataset.minlength || 0);
      const isBlank = value === '';
      const isTooShort = minLength > 0 && value.length < minLength;

      if(!control.checkValidity() || isBlank || isTooShort){
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

  const ATTACHMENT_LIMITS = {
    maxBytes: 3 * 1024 * 1024,
    maxImageDimension: 1600,
    jpegQuality: 0.8
  };

  function guessType(file){
    if(file.type) return file.type;
    return /\.pdf$/i.test(file.name) ? 'application/pdf' : '';
  }

  function attachmentProblem(file){
    const type = guessType(file);
    if(type === 'application/pdf'){
      if(file.size > ATTACHMENT_LIMITS.maxBytes) return 'That PDF is over 3 MB. Please attach a smaller one.';
      return '';
    }
    if(type.startsWith('image/')) return '';
    return 'Please attach a photo, screenshot or PDF.';
  }

  function loadImage(file){
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('That image could not be read. Try a different photo, a screenshot or a PDF.'));
      };
      img.src = url;
    });
  }

  async function shrinkImage(file){
    const img = await loadImage(file);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = Math.min(1, ATTACHMENT_LIMITS.maxImageDimension / longest);
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('That image could not be processed.')),
        'image/jpeg',
        ATTACHMENT_LIMITS.jpegQuality
      );
    });
  }

  function fileToBase64(blob){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('That file could not be read.'));
      reader.readAsDataURL(blob);
    });
  }

  async function prepareAttachment(file){
    const problem = attachmentProblem(file);
    if(problem) throw new Error(problem);

    if(guessType(file) === 'application/pdf'){
      return { type: 'application/pdf', data: await fileToBase64(file) };
    }
    const jpeg = await shrinkImage(file);
    if(jpeg.size > ATTACHMENT_LIMITS.maxBytes) throw new Error('That image is too large. Please try a smaller one.');
    return { type: 'image/jpeg', data: await fileToBase64(jpeg) };
  }

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

    let timer;
    try {
      const payload = collectPayload();
      const fileInput = document.getElementById(currentCategory === 'it' ? 'itFile' : 'techFile');
      if(fileInput.files && fileInput.files[0]){
        try {
          payload.attachment = await prepareAttachment(fileInput.files[0]);
        } catch(fileErr){
          showSubmitError(fileErr.message);
          return;
        }
      }

      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), 45000);
      const response = await fetch('/api/submit-ticket', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if(!response.ok || !result.success){
        throw new Error(result.error || 'Submission failed');
      }
      showConfirmation(result.ticketRef);
    } catch(err){
      console.error('Ticket submit failed:', err);
      if(err.message === 'Invalid attachment'){
        showSubmitError("That file wasn't accepted. Please attach a photo, screenshot or a PDF under 3 MB, or remove it and submit without.");
      } else {
        showSubmitError("That didn't go through. Please check your connection and try again. If it keeps happening, let IT know.");
      }
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
    const errorEl = drop.parentElement.querySelector('.file-error');
    const defaultHTML = textEl.innerHTML;

    function showFileError(message){
      errorEl.textContent = message;
      errorEl.style.display = message ? 'block' : 'none';
    }

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if(!file){
        textEl.innerHTML = defaultHTML;
        showFileError('');
        return;
      }
      const problem = attachmentProblem(file);
      if(problem){
        input.value = '';
        textEl.innerHTML = defaultHTML;
        showFileError(problem);
        return;
      }
      textEl.textContent = '📎 ' + file.name;
      showFileError('');
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
        input.dispatchEvent(new Event('change'));
      }
    });
  }
  setupFileDrop('itFileDrop', 'itFile');
  setupFileDrop('techFileDrop', 'techFile');