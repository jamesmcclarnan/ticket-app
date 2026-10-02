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
  function selectCategory(cat){
    document.getElementById('itFields').style.display = cat === 'it' ? 'block' : 'none';
    document.getElementById('techFields').style.display = cat === 'technical' ? 'block' : 'none';
    document.getElementById('formTitle').textContent = cat === 'it' ? "Tell us what's happening" : "Tell us about the fault";
    document.getElementById('formSubtitle').textContent = cat === 'it' ? "Fill in as much detail as you can." : "Include as much detail as you can.";
    showScreen('screen-form');
    setProgress(2);
  }
  function goToCategory(){
    showScreen('screen-category');
    setProgress(1);
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

  function submitTicket(){
    if(!validateForm()){
      const firstInvalid = document.querySelector('#screen-form .field.invalid');
      if(firstInvalid) firstInvalid.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.classList.add('is-loading');
    setTimeout(() => {
      showScreen('screen-confirm');
      setProgress(3);
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }, 650);
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
