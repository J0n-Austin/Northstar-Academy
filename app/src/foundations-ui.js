  // Stage 4.1 learning layer; no code execution or identity verification occurs here.
  function fGet(id){return FOUNDATIONS.lessons.find(function(x){return x.id===id;});}
  function fUnit(id){return FOUNDATIONS.units.find(function(x){return x.id===id;});}
  function fIsDone(id){return !!state.foundations.completed[id];}
  function fOpen(l){return l.prerequisites.every(fIsDone);}
  function fProgress(){var done=FOUNDATIONS.lessons.filter(function(l){return fIsDone(l.id);}).length;return {done:done,total:FOUNDATIONS.lessons.length};}
  function fStatus(l){return fIsDone(l.id)?'Practice marked':fOpen(l)?'Ready to learn':'Prerequisites needed';}
  function fCard(l){var status=fStatus(l);return '<button type="button" class="f-lesson-card '+(fIsDone(l.id)?'f-complete':!fOpen(l)?'f-locked':'')+'" data-foundation-lesson="'+l.id+'"><span class="mono f-small">'+esc(l.id)+' · '+esc(l.level)+'</span><strong>'+esc(l.title)+'</strong><span class="f-small">'+esc(status)+'</span></button>';}
  function fBind(){document.querySelectorAll('[data-foundation-lesson]').forEach(function(b){b.addEventListener('click',function(){setView('foundation-lesson',b.dataset.foundationLesson);});});}
  function fDiagram(unit,step){
    var items={
      linux:['Shell or process input','Validated command and permission policy','Bounded subprocess result'],
      networking:['TCP bytes and framing','Bounded, exact-length read','Parsed application message'],
      'data-structures':['Input collection or dependency graph','Select algorithm and invariant','Ordered, tested output'],
      architecture:['API transport boundary','Authorization and domain policy','Persistence and observable result'],
      python:['Untrusted JSON / user input','Validated domain values','Pure transformations → database boundary'],
      http:['HTTP request: method / path / headers','Handler: parse, validate, authorize','HTTP response: status / JSON / no secrets'],
      sql:['BEGIN: consistent starting balances','Debit + credit within one transaction','COMMIT success OR ROLLBACK all changes'],
      testing:['Arrange independent fixture','Act on behavior under test','Assert contract AND side-effect invariants'],
      debugging:['Observe and reproduce symptom','Trace call path and challenge hypothesis','Fix small defect + add regression'],
      cs:['Input state + preconditions','Apply transition and data structures','Validate invariant + complexity']
    }[unit]||[];
    return '<div class="f-flow" aria-label="Three-stage concept diagram">'+items.map(function(t,i){return '<div class="f-flow-node '+(i===step?'active':'')+'"><span>'+String(i+1)+'</span>'+esc(t)+'</div>';}).join('<span class="f-flow-arrow" aria-hidden="true">→</span>')+'</div>';
  }
  function fDrawDiagram(unit,step){var box=$('#f-flow-area');if(box)box.innerHTML=fDiagram(unit,step);document.querySelectorAll('[data-f-stage]').forEach(function(btn){btn.setAttribute('aria-pressed',String(Number(btn.dataset.fStage)===step));});}
  // Small escape-first Markdown subset for authored, bundled guides. No external HTML is evaluated.
  function fGuideHTML(markdown){
    var result=[],lines=markdown.split('\n'),code=false,list=false;
    function closeList(){if(list){result.push('</ul>');list=false;}}
    lines.forEach(function(line){
      if(line.startsWith('```')){closeList();result.push(code?'</code></pre>':'<pre class="f-code"><code>');code=!code;return;}
      if(code){result.push(esc(line)+'\n');return;}
      if(!line.trim()){closeList();return;}
      var text=esc(line).replace(/`([^`]+)`/g,'<code>$1</code>');
      if(/^###? /.test(line)){closeList();result.push('<h3>'+text.replace(/^#+\s*/, '')+'</h3>');}
      else if(/^# /.test(line)){closeList();result.push('<h2>'+text.replace(/^#\s*/, '')+'</h2>');}
      else if(/^[-*] /.test(line)){if(!list){result.push('<ul>');list=true;}result.push('<li>'+text.slice(2)+'</li>');}
      else if(/^\d+\. /.test(line)){closeList();result.push('<p>'+text+'</p>');}
      else {closeList();result.push('<p>'+text+'</p>');}
    });closeList();if(code)result.push('</code></pre>');return result.join('');
  }
  function fTraceHTML(l,step){
    var scenes=[
      {name:'Predict',message:'Read the input and state the contract before running the example: '+l.practice},
      {name:'Observe',message:'Compare the real worked example with your prediction. '+l.walkthrough},
      {name:'Investigate',message:'Now change one boundary or invalid input and inspect the failure. '+l.misconception},
      {name:'Prevent regression',message:'Record a falsifiable assertion and apply it to '+l.bridge.join(', ')+'. Run the actual workshop in Codespaces.'}
    ];var scene=scenes[Math.min(3,Math.max(0,step))];
    return '<div class="f-trace-head"><strong>'+esc(scene.name)+'</strong><span class="mono f-small">Step '+(step+1)+' / 4</span></div><p>'+esc(scene.message)+'</p><div class="f-trace-dots">'+scenes.map(function(x,i){return '<span class="'+(i===step?'active':'')+'" aria-hidden="true"></span>';}).join('')+'</div>';
  }
  function renderFoundations(){
    state.selectedTrack='commercial';
    var p=fProgress();
    view.innerHTML='<h1 class="ph">Engineering Foundations</h1><div class="ph-sub">Learn concepts → step through a diagnostic trace → answer a formative check → run real engineering workshops → maintain the banking service.</div>'+
    '<section class="card f-intro"><strong>'+p.done+' / '+p.total+' learning milestones marked</strong><div class="practice-meter"><span style="width:'+(p.done/p.total*100)+'%"></span></div><p class="f-small">Completion is a local self-report. Browser checks are open-book practice, not code grading, human review, or a credential. All ten coding workshops must run in Codespaces or Linux.</p><div class="r-actions"><button class="btn" data-view-jump="residency">Open residency board →</button><button class="btn" data-view-jump="skills">Learning evidence →</button></div></section>'+
    '<div class="f-unit-grid">'+FOUNDATIONS.units.map(function(u){
      var ls=FOUNDATIONS.lessons.filter(function(l){return l.unit===u.id;});
      return '<section class="card f-unit"><div class="f-unit-header"><div><div class="path-kicker">'+ls.length+' sequenced learning milestones</div><h2>'+esc(u.title)+'</h2></div><strong>'+ls.filter(function(l){return fIsDone(l.id);}).length+'/'+ls.length+'</strong></div><p>'+esc(u.overview)+'</p><div class="f-lessons">'+ls.map(fCard).join('')+'</div><p class="f-small">Workshop: <code>'+esc(u.lab)+'</code></p></section>';
    }).join('')+'</div>';
    bindJumps();fBind();
  }
  function renderFoundationLesson(id){
    var l=fGet(id);if(!l){setView('foundations');return;}
    var u=fUnit(l.unit),allowed=fOpen(l),quizPassed=!!state.foundations.quizzes[id],answer=state.foundations.answers[id],hint=state.foundations.hints[id]||0,note=state.foundations.notes[id]||'';
    var prereqText=l.prerequisites.map(function(p){var x=fGet(p);return '<button type="button" class="act" data-foundation-lesson="'+p+'">'+esc(x?x.title:p)+' '+(fIsDone(p)?'✓':'○')+'</button>';}).join(' ');
    var next=FOUNDATIONS.lessons.find(function(x){return x.unit===l.unit&&x.position===l.position+1;});
    view.innerHTML='<div class="r-actions"><button class="btn" data-view-jump="foundations">← All foundations</button><button class="btn" data-view-jump="residency">Residency board →</button></div>'+
      '<div class="path-kicker">'+esc(u.title)+' · Lesson '+l.position+'/'+FOUNDATIONS.lessons.filter(function(x){return x.unit===l.unit;}).length+' · '+esc(l.level)+' · '+esc(l.id)+'</div><h1 class="ph">'+esc(l.title)+'</h1><div class="ph-sub">This lesson prepares you for '+l.bridge.map(esc).join(', ')+'.</div>'+
      (l.prerequisites.length?'<section class="card f-prereq"><strong>Prerequisites</strong><div class="r-actions">'+prereqText+'</div>'+(!allowed?'<p class="f-small">Read ahead if you wish, but the practice milestone stays locked until prerequisite lessons are marked complete.</p>':'<p class="f-small">Required learning milestones recorded locally.</p>')+'</section>':'')+
      '<div class="f-lesson-layout"><div class="f-lesson-main">'+
      '<section class="card f-panel"><div class="path-kicker">01 · Learn</div><h2>What you need to understand</h2><p>'+esc(l.explanation)+'</p><h3>Learning objectives</h3><ul>'+l.objectives.map(function(o){return '<li>'+esc(o)+'</li>';}).join('')+'</ul><p class="f-small">Full reading guide: <code>'+esc(u.guide)+'</code> in the source repository and Codespaces.</p></section>'+
      '<details class="card f-panel f-reading"><summary><strong>Read the full '+esc(u.title)+' chapter</strong> · source examples, failure cases and workshop preparation</summary><div class="f-reading-body">'+fGuideHTML(FOUNDATION_GUIDES[FOUNDATIONS.units.indexOf(u)])+'</div></details>'+
      '<section class="card f-panel"><div class="path-kicker">02 · Visualize</div><h2>Follow the engineering flow</h2><div id="f-flow-area">'+fDiagram(l.unit,0)+'</div><div class="r-actions" role="group" aria-label="Choose diagram stage">'+[0,1,2].map(function(n){return '<button type="button" class="btn" data-f-stage="'+n+'" aria-pressed="'+(n===0)+'">Stage '+(n+1)+'</button>';}).join('')+'</div></section>'+
      '<section class="card f-panel"><div class="path-kicker">03 · Worked example</div><h2>Read and predict</h2><pre class="f-code">'+esc(l.code)+'</pre><p>'+esc(l.walkthrough)+'</p><p class="f-caution"><strong>Common pitfall:</strong> '+esc(l.misconception)+'</p></section>'+
      '<section class="card f-panel"><div class="path-kicker">04 · Trace the failure</div><h2>Step through the engineering scenario</h2><p class="f-small">Use each step to predict the state before revealing the next observation. This is a deterministic teaching visualization, not an executing Python debugger.</p><div class="f-trace" id="f-trace-box" aria-live="polite">'+fTraceHTML(l,0)+'</div><div class="r-actions"><button type="button" class="btn" id="f-trace-prev">← Previous</button><button type="button" class="btn" id="f-trace-next">Next observation →</button></div></section>'+
      '<section class="card f-panel"><div class="path-kicker">05 · Check understanding</div><h2>'+esc(l.check.prompt)+'</h2><div class="f-answers" role="group" aria-label="Answer options">'+l.check.choices.map(function(c,i){return '<button type="button" class="f-answer '+(answer===i?'f-selected':'')+'" data-f-answer="'+i+'">'+String.fromCharCode(65+i)+'. '+esc(c)+'</button>';}).join('')+'</div><p id="f-result" class="f-feedback" aria-live="polite">'+(answer===undefined?'Choose an answer to see explanation.':answer===l.check.answer?'Correct. '+esc(l.check.rationale):'Not quite. '+esc(l.check.rationale)+' Try again.')+'</p><div class="r-actions"><button type="button" class="btn" id="f-hint">'+(hint?'Next hint':'Show a hint')+' ('+hint+'/3)</button></div><div id="f-hint-body" class="f-hint" aria-live="polite">'+(hint?esc(l.hints.slice(0,hint).join('  •  ')):'')+'</div></section>'+
      '</div><aside class="f-lesson-side">'+
      '<section class="card f-panel"><div class="path-kicker">06 · Real practice</div><h2>Open the workshop</h2><p>'+esc(l.practice)+'</p><p class="f-small">Real source: <code>'+esc(l.workshop)+'</code></p><pre class="f-code">cd '+esc('labs/foundations/'+l.unit)+'\nbash smoke-test.sh\nbash run-checks.sh</pre><p class="f-small">Individual learner contract tests are intentionally red before the repair; repository release checks stay green.</p><a class="btn" href="https://github.com/j0n-austin/Northstar-Academy/tree/main/'+esc('labs/foundations/'+l.unit)+'" target="_blank" rel="noopener noreferrer">Open workshop in GitHub ↗</a></section>'+
      '<section class="card f-panel"><div class="path-kicker">07 · Reflect and continue</div><h2>Learning evidence (self-reported)</h2><label class="f-label" for="f-note">What did you predict, test or change? Include your exact command and an observed result.</label><textarea class="f-note" id="f-note" maxlength="2500" rows="5" placeholder="I ran ...; expected ...; observed ...; next I will ...">'+esc(note)+'</textarea><div class="r-actions"><button class="btn" id="f-save-note">Save notes</button><button class="btn pri" id="f-finish" '+(!allowed||!quizPassed?'disabled':'')+'>'+(fIsDone(id)?'Update practice milestone':'Mark learning milestone →')+'</button></div><p class="f-small" id="f-complete-info" aria-live="polite">'+(fIsDone(id)?'Marked as practiced locally. No code was checked.':!allowed?'Complete prerequisite learning milestones first.':!quizPassed?'Answer the formative check correctly to continue.':'Provide at least 30 characters of meaningful reflection, then mark completion.')+'</p></section>'+
      '<section class="card f-panel"><h2>Use it on the job</h2><p>When ready, apply this skill to the connected banking service. Relevant tickets: '+l.bridge.map(esc).join(', ')+'.</p><button class="btn" data-view-jump="residency">Open sprint board →</button>'+(next?'<button class="btn" data-foundation-lesson="'+next.id+'">Next lesson →</button>':'')+'</section></aside></div>';
    fBind();bindJumps();
    var traceStep=0; function updateTrace(){ $('#f-trace-box').innerHTML=fTraceHTML(l,traceStep); $('#f-trace-prev').disabled=traceStep===0;$('#f-trace-next').disabled=traceStep===3;}
    $('#f-trace-prev').addEventListener('click',function(){traceStep=Math.max(0,traceStep-1);updateTrace();});
    $('#f-trace-next').addEventListener('click',function(){traceStep=Math.min(3,traceStep+1);updateTrace();});updateTrace();
    document.querySelectorAll('[data-f-stage]').forEach(function(b){b.addEventListener('click',function(){fDrawDiagram(l.unit,Number(b.dataset.fStage));});});
    document.querySelectorAll('[data-f-answer]').forEach(function(b){b.addEventListener('click',function(){var n=Number(b.dataset.fAnswer);state.foundations.notes[id]=$('#f-note').value.trim();state.foundations.answers[id]=n;if(n===l.check.answer)state.foundations.quizzes[id]=true;save();renderFoundationLesson(id);});});
    $('#f-hint').addEventListener('click',function(){state.foundations.notes[id]=$('#f-note').value.trim();state.foundations.hints[id]=Math.min(3,(state.foundations.hints[id]||0)+1);save();renderFoundationLesson(id);});
    $('#f-save-note').addEventListener('click',function(){state.foundations.notes[id]=$('#f-note').value.trim();save();$('#f-complete-info').textContent='Notes saved in this browser only.';});
    $('#f-finish').addEventListener('click',function(){
      state.foundations.notes[id]=$('#f-note').value.trim();
      if(!fOpen(l)||!state.foundations.quizzes[id])return;
      if(state.foundations.notes[id].length<30){$('#f-complete-info').textContent='Write a specific reflection of at least 30 characters including observed behavior.';return;}
      state.foundations.completed[id]=true;save();renderFoundationLesson(id);
    });
  }
  function fSkillsHTML(){var p=fProgress();return '<h2 class="sec-h">Engineering foundations · learning progress (unverified)</h2><section class="card f-intro"><strong>'+p.done+'/'+p.total+' locally marked practice milestones · 0 code-verified foundation competencies</strong><p>Answers and reflections are stored in this browser only. They are not proof that runnable workshops pass or were solved independently. Human-reviewed commits and trusted tests are required for verified proficiency.</p>'+FOUNDATIONS.units.map(function(u){var done=FOUNDATIONS.lessons.filter(function(l){return l.unit===u.id&&fIsDone(l.id);}).length;return '<div class="f-progress-row"><span>'+esc(u.title)+'</span><strong>'+done+'/'+FOUNDATIONS.lessons.filter(function(x){return x.unit===u.id;}).length+'</strong></div>';}).join('')+'<button class="btn" data-view-jump="foundations">Continue foundations →</button></section>';}
  function fTicketBridge(t){var relevant=FOUNDATIONS.lessons.filter(function(l){return l.bridge.includes(t.id);});if(!relevant.length)return '';
    var studied=relevant.filter(function(l){return fIsDone(l.id);}).length;
    return '<section class="card f-panel"><div class="path-kicker">Preparation pathway · '+studied+'/'+relevant.length+' locally practiced</div><h2>Learn the foundations before this ticket</h2><p class="f-small">These are recommended study milestones; existing tickets remain accessible and these records do not verify code skill.</p><div class="f-bridge-links">'+relevant.map(function(l){return '<button class="act" data-foundation-lesson="'+l.id+'">'+(fIsDone(l.id)?'✓ ':'○ ')+esc(l.title)+'</button>';}).join('')+'</div></section>';
  }
