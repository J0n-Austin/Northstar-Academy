  // Stage 4: a local-only simulation of an engineering workflow around real
  // Codespaces work. Nothing written here verifies code or author identity.
  function rRecord(id){
    if(!state.residency.tickets[id])state.residency.tickets[id]={status:'todo',summary:'',tests:'',commit:'',risk:'',feedback:'',reply:''};
    return state.residency.tickets[id];
  }
  function rStatus(record){
    return ({todo:'To do',doing:'In progress',submitted:'Awaiting simulated review',revision:'Changes requested',practice:'Practice reviewed'})[record.status]||'To do';
  }
  function rCounts(){
    var n={todo:0,doing:0,submitted:0,revision:0,practice:0};
    RESIDENCY.tickets.forEach(function(t){n[rRecord(t.id).status]++;});
    return n;
  }
  function rAttr(value){return esc(String(value||'')).replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function rTicket(id){return RESIDENCY.tickets.find(function(t){return t.id===id;});}
  function rBindCards(){document.querySelectorAll('[data-residency-ticket]').forEach(function(b){b.addEventListener('click',function(){setView('residency-ticket',b.dataset.residencyTicket);});});}
  function rCard(t){
    var record=rRecord(t.id);
    return '<button type="button" class="r-ticket" data-residency-ticket="'+rAttr(t.id)+'"><span class="mono r-ticket-id">'+esc(t.id)+'</span><strong>'+esc(t.title)+'</strong><span class="r-small">'+esc(t.role)+' · '+esc(t.level)+'</span><span class="r-status r-'+rAttr(record.status)+'">'+esc(rStatus(record))+'</span></button>';
  }
  function rSummaryBar(){
    var counts=rCounts(), completed=counts.practice, staged=counts.submitted+counts.revision;
    return '<div class="r-overview"><div><strong>'+completed+' / 8</strong><span>Practice-reviewed tickets</span></div><div><strong>'+staged+'</strong><span>Awaiting review / revisions</span></div><div><strong>0</strong><span>Independently verified</span></div></div>';
  }
  function renderResidency(){
    state.selectedTrack='commercial';
    var counts=rCounts();
    view.innerHTML='<h1 class="ph">Banking Engineering Residency</h1><div class="ph-sub">Four sprints · eight tickets · one real Python/SQLite service · GitHub-based work</div>'+rSummaryBar()+
      '<section class="card r-notice"><strong>Real work, honest records.</strong> All account data is synthetic and the server binds localhost. The browser tracks your own practice and simulated senior-engineer feedback. It does not inspect commits, execute Python, verify skills or act as a real code reviewer.</section>'+
      '<div class="r-actions"><a class="btn pri" href="https://github.com/j0n-austin/Northstar-Academy/tree/main/labs/banking-residency" target="_blank" rel="noopener noreferrer">Open residency source ↗</a><button class="btn" id="r-export">Export practice record</button><button class="btn" data-view-jump="commercial">Commercial pathway →</button></div>'+
      '<div class="r-sprint-grid">'+RESIDENCY.sprints.map(function(s){
        var cards=RESIDENCY.tickets.filter(function(t){return t.sprint===s.id;}).map(rCard).join('');
        return '<section class="card r-sprint"><div class="hd"><h2>'+esc(s.label)+' · '+esc(s.theme)+'</h2></div><p class="r-small">'+esc(s.goal)+'</p><div class="r-ticket-stack">'+cards+'</div><p class="r-small">Run <code>python3 -m unittest tests.test_sprint'+s.id+' -v</code> from the residency directory.</p></section>';
      }).join('')+'</div>'+
      '<section class="card r-notice"><h2>Engineering methodology</h2><p>Read the ticket → reproduce the defect → add/maintain tests → implement the fix → submit a Git branch and PR → respond to feedback → document the release evidence. Request a real human review for any externally verified assessment.</p></section>';
    rBindCards();bindJumps();
    $('#r-export').addEventListener('click',rExport);
  }
  function rGuide(sprint){
    var source=RESIDENCY_LESSONS[sprint-1]||'';
    return source.split(/\n(?=## )/).filter(Boolean).map(function(part){
      var lines=part.trim().split('\n');
      var heading=lines[0].replace(/^#+\s*/, '');
      return '<div class="r-lesson-section"><h3>'+esc(heading)+'</h3><p>'+esc(lines.slice(1).join('\n').trim())+'</p></div>';
    }).join('');
  }
  function rRow(label,value,tag){return '<div class="r-field"><label for="'+tag+'">'+label+'</label><textarea id="'+tag+'" rows="3" maxlength="3000">'+esc(value)+'</textarea></div>';}
  function renderResidencyTicket(id){
    var t=rTicket(id);if(!t){setView('residency');return;}
    var record=rRecord(id);
    var prerequisites=t.depends.map(function(x){return rTicket(x);});
    var allDone=prerequisites.every(function(x){return rRecord(x.id).status==='practice';});
    var guide=['01-service-foundations.md','02-apis-and-appsec.md','03-transaction-design.md','04-testing-and-release.md'][t.sprint-1];
    view.innerHTML='<div class="r-actions"><button class="btn" id="r-back">← Sprint board</button><button class="btn" data-view-jump="skills">Competency evidence →</button></div>'+
      '<div class="r-ticket-header"><span class="mono">'+esc(t.id)+' · Sprint '+t.sprint+'</span><span class="r-status r-'+rAttr(record.status)+'">'+esc(rStatus(record))+'</span></div>'+ 
      '<h1 class="ph">'+esc(t.title)+'</h1><div class="ph-sub">'+esc(t.role)+' · '+esc(t.level)+' · '+t.topics.map(function(x){return esc(x);}).join(' · ')+'</div>'+
      (!allDone&&prerequisites.length?'<div class="path-note">Suggested prerequisites: '+prerequisites.map(function(x){return esc(x.id)+' ('+esc(rStatus(rRecord(x.id)))+')';}).join(', ')+'. You can still inspect this ticket; the portal does not enforce prerequisites.</div>':'')+
      '<div class="r-ticket-columns"><div class="r-main">'+
      '<section class="card r-panel"><h2>Incoming engineering ticket</h2><p>'+esc(t.context)+'</p><h3>What you need to understand</h3><p>'+esc(t.learning)+'</p></section>'+
      '<section class="card r-panel"><h2>Read the sprint guide</h2><p>These concepts explain the real code and tradeoffs you will meet in this ticket.</p><details><summary>Open Sprint '+t.sprint+' engineering lessons</summary>'+rGuide(t.sprint)+'</details></section>'+
      '<section class="card r-panel"><h2>Acceptance criteria</h2><ul>'+t.acceptance.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul><h3>Files to investigate</h3><p class="mono">'+t.files.map(esc).join(' · ')+'</p></section>'+
      '<section class="card r-panel"><h2>Working in your repository</h2><p>Run these from <code>labs/banking-residency/</code>. Use a separate branch, then open a GitHub pull request.</p><pre class="r-commands">'+t.commands.map(esc).join('\n')+'</pre><details><summary>Escalating hint</summary><p>'+esc(t.hint)+'</p></details><p class="r-small">Learning guide: <code>guides/'+esc(guide)+'</code>. Evidence template: <code>templates/engineering-report.md</code>.</p></section>'+
      '</div><aside class="r-side">'+
      '<section class="card r-panel"><h2>Workflow</h2><p class="r-small">This is a local training board. Status changes are not synced to GitHub.</p><div class="r-actions"><button class="btn" id="r-start">Start work</button><button class="btn" id="r-save">Save draft</button></div></section>'+
      '<section class="card r-panel"><h2>Submit PR evidence</h2><p class="r-small">Never paste secrets or sensitive customer data. Save only sanitized evidence and public Git commit identifiers.</p>'+rRow('Problem, root cause and design choice',record.summary,'r-summary')+rRow('Exact test commands and observed results',record.tests,'r-tests')+
      '<div class="r-field"><label for="r-commit">Git commit SHA or PR link (optional until submission)</label><input type="text" id="r-commit" maxlength="400" value="'+rAttr(record.commit)+'"/></div>'+rRow('Security / release risk and rollback plan',record.risk,'r-risk')+
      '<button class="btn pri" id="r-submit">Submit for practice review →</button><button class="btn" id="r-copy">Copy PR draft</button></section>'+
      '<section class="card r-panel"><h2>Senior engineer · simulated feedback</h2><p>'+esc(t.reviewPrompt)+'</p><p class="r-small">You can request a deterministic checklist-based practice review. No code is analyzed.</p><button class="btn" id="r-review" '+(record.status!=='submitted'?'disabled':'')+'>Run practice review</button>'+
      (record.feedback?'<div class="r-feedback" aria-live="polite">'+esc(record.feedback)+'</div>':'<p class="r-small" id="r-review-empty">Not reviewed yet.</p>')+rRow('My response to reviewer / improvement notes',record.reply,'r-reply')+'</section></aside></div>';
    function readInputs(){
      ['summary','tests','commit','risk','reply'].forEach(function(k){record[k]=$('#r-'+k).value.trim();});
    }
    function saveDraft(){readInputs();if(record.status==='todo')record.status='doing';save();}
    $('#r-back').addEventListener('click',function(){saveDraft();setView('residency');});
    $('#r-start').addEventListener('click',function(){saveDraft();setView('residency-ticket',id);});
    $('#r-save').addEventListener('click',function(){saveDraft();setView('residency-ticket',id);});
    $('#r-submit').addEventListener('click',function(){saveDraft();record.status='submitted';record.feedback='';save();setView('residency-ticket',id);});
    $('#r-review').addEventListener('click',function(){
      readInputs();
      var issues=[];
      if(record.summary.length<80)issues.push('Explain reproduction, root cause and your design choice (at least a short technical paragraph).');
      if(!/(python3|bash |unittest|pytest)/i.test(record.tests)||record.tests.length<25)issues.push('Include a reproducible test command AND the observed result; a command alone is insufficient.');
      if(!/^(?:[0-9a-f]{7,40}|https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+)$/i.test(record.commit))issues.push('Include a commit SHA (7–40 hex chars) or a GitHub pull request URL.');
      if(record.risk.length<45)issues.push('Document the security impact and a realistic rollback or validation plan.');
      record.status=issues.length?'revision':'practice';
      record.feedback=issues.length?'Changes requested (practice checklist only): '+issues.join(' '):'Practice review passed: your written submission covers the checklist. This does NOT verify the commit, correctness, security, test results or independence. Request a real reviewer for those claims. Reviewer question: '+t.reviewPrompt;
      save();setView('residency-ticket',id);
    });
    $('#r-copy').addEventListener('click',function(){
      readInputs();save();
      var content='# '+t.id+' — '+t.title+'\n\n## Root cause and design\n'+record.summary+'\n\n## Tests (self-reported)\n'+record.tests+'\n\n## Commit / PR\n'+record.commit+'\n\n## Risk / rollback\n'+record.risk+'\n\n## Reviewer response\n'+record.reply+'\n';
      var b=$('#r-copy');
      if(!navigator.clipboard||!navigator.clipboard.writeText){b.textContent='Clipboard unavailable; use your saved fields';return;}
      navigator.clipboard.writeText(content).then(function(){b.textContent='Draft copied';}).catch(function(){b.textContent='Copy unavailable — select your saved text';});
    });
    bindJumps();
  }
  function rExport(){
    var record={title:'Northstar banking residency — local unverified practice',generatedAt:new Date().toISOString(),disclaimer:'SELF-REPORTED. Browser simulation only; no Git or test result verification performed.',tickets:RESIDENCY.tickets.map(function(t){return {id:t.id,title:t.title,record:rRecord(t.id)};})};
    var blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='northstar-banking-practice-record.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  function rCompetencyHTML(){
    var count=rCounts(),items=RESIDENCY.tickets;
    var categories=[['Python / HTTP',[1,2]],['Application security',[3,4,7]],['Transactional systems',[5,6]],['Testing & engineering communication',[1,5,6,8]]];
    return '<h2 class="sec-h">Banking residency · skill evidence (local / unverified)</h2>'+rSummaryBar()+
      '<section class="card r-panel"><p>Three distinct evidence levels: (1) coursework attempted, (2) written evidence awaiting review, (3) human-verified work. Only the first two are stored in this browser. A practice-reviewed ticket is not a validated engineering competency.</p>'+categories.map(function(group){
      var relevant=group[1].map(function(n){return items[n-1];});
      var practiced=relevant.filter(function(t){return rRecord(t.id).status==='practice';}).length;
      var pending=relevant.filter(function(t){return rRecord(t.id).status==='submitted';}).length;
      return '<div class="r-competency"><strong>'+group[0]+'</strong><div class="r-small">'+practiced+'/'+relevant.length+' practice-reviewed · '+pending+' awaiting simulated review · 0 independently verified</div><div>'+relevant.map(function(t){return '<button class="act" data-residency-ticket="'+t.id+'">'+t.id+' ↗</button> ';}).join('')+'</div></div>';
    }).join('')+'<button class="btn" data-view-jump="residency">Open sprint board →</button></section>';
  }
