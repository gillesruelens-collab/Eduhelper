
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StudyLevel, FeatureType, TestType, GlossaryItem, Flashcard, MindmapNode, Question, TestResult, StructuredSummary } from './types';
import * as gemini from './geminiService';
import { Mindmap } from './components/Mindmap';

// External library access
declare const pdfjsLib: any;
declare const mammoth: any;

const App: React.FC = () => {
  // State
  const [level, setLevel] = useState<StudyLevel>(StudyLevel.YEAR_1);
  const [extractedText, setExtractedText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeFeature, setActiveFeature] = useState<FeatureType | null>(null);
  
  // Feature Data
  const [summaryData, setSummaryData] = useState<StructuredSummary | null>(null);
  const [summaryImages, setSummaryImages] = useState<Record<number, string>>({});
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [mindmapData, setMindmapData] = useState<MindmapNode | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isGrading, setIsGrading] = useState<boolean>(false);

  // File Upload Handling
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setExtractedText("");
    setActiveFeature(null);
    setSummaryData(null);
    setSummaryImages({});
    
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        setExtractedText(text);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setExtractedText(result.value);
      } else {
        const text = await file.text();
        setExtractedText(text);
      }
    } catch (error) {
      console.error("Fout bij het lezen van het bestand:", error);
      alert("Kon het bestand niet verwerken. Probeer een standaard PDF of .docx bestand.");
      setFileName("");
    } finally {
      setIsProcessing(false);
    }
  };

  // Feature Trigger
  const runFeature = async (feature: FeatureType, testType?: TestType) => {
    if (!extractedText) {
      alert("Upload eerst een document!");
      return;
    }

    setIsProcessing(true);
    setActiveFeature(feature);
    setTestResult(null);
    setTestAnswers({});

    try {
      switch (feature) {
        case FeatureType.SUMMARY:
          const data = await gemini.generateSummary(extractedText, level);
          setSummaryData(data);
          // Trigger image generation for each section asynchronously
          data.sections.forEach(async (section, index) => {
            try {
              const imgUrl = await gemini.generateIllustration(section.imagePrompt);
              if (imgUrl) {
                setSummaryImages(prev => ({ ...prev, [index]: imgUrl }));
              }
            } catch (err) {
              console.warn("Kon illustratie niet genereren voor sectie " + index);
            }
          });
          break;
        case FeatureType.GLOSSARY:
          const g = await gemini.generateGlossary(extractedText, level);
          setGlossary(g);
          break;
        case FeatureType.FLASHCARDS:
          const f = await gemini.generateFlashcards(extractedText, level);
          setFlashcards(f);
          break;
        case FeatureType.MINDMAP:
          const m = await gemini.generateMindmapData(extractedText, level);
          setMindmapData(m);
          break;
        case FeatureType.TEST:
          if (testType) {
            const t = await gemini.generateTest(extractedText, level, testType);
            setTestQuestions(t);
          }
          break;
      }
    } catch (error) {
      console.error(error);
      alert("Er ging iets mis bij het genereren van de inhoud.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGradeTest = async () => {
    setIsGrading(true);
    try {
      const result = await gemini.gradeTest(extractedText, testQuestions, testAnswers, level);
      setTestResult(result);
    } catch (error) {
      console.error(error);
      alert("Kon test niet verbeteren.");
    } finally {
      setIsGrading(false);
    }
  };

  // Helper Components
  const LevelButton: React.FC<{ l: StudyLevel }> = ({ l }) => (
    <button
      onClick={() => setLevel(l)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        level === l 
          ? 'bg-indigo-600 text-white shadow-lg' 
          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
      }`}
    >
      {l}
    </button>
  );

  return (
    <Layout>
      <div className="space-y-12">
        {/* Intro Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Studeer <span className="text-indigo-600">Slimmer</span>, niet harder.
          </h2>
          <p className="text-lg text-slate-600">
            Upload je lesmateriaal en laat onze AI samenvattingen, mindmaps en oefentoetsen op maat maken voor jouw niveau.
          </p>
        </section>

        {/* Level Selection Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Selecteer je jaar</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.values(StudyLevel).map((l) => (
              <LevelButton key={l} l={l} />
            ))}
          </div>
        </section>

        {/* File Upload Section */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="w-full max-w-xl">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-indigo-200 rounded-2xl cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 transition-colors group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-slate-700"><span className="font-semibold">Klik om te uploaden</span> of sleep hierheen</p>
                <p className="text-xs text-slate-500">PDF of Word (.docx) document (max. 10MB)</p>
              </div>
              <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
            </label>
          </div>
          {fileName && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-4 py-2 rounded-full border border-green-100">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Bestand: <strong>{fileName}</strong></span>
              </div>
              <p className="text-xs text-slate-400 italic">De AI zal enkel de inhoud van dit bestand gebruiken.</p>
            </div>
          )}
        </section>

        {/* Feature Buttons Section */}
        <section className={`grid grid-cols-2 md:grid-cols-5 gap-4 transition-opacity ${!extractedText ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          {[
            { type: FeatureType.SUMMARY, icon: "📝", label: "Samenvatting" },
            { type: FeatureType.MINDMAP, icon: "🧠", label: "Mindmap" },
            { type: FeatureType.GLOSSARY, icon: "📖", label: "Begrippen" },
            { type: FeatureType.FLASHCARDS, icon: "🎴", label: "Steekkaarten" },
            { type: FeatureType.TEST, icon: "✏️", label: "Oefentoets" },
          ].map((feat) => (
            <button
              key={feat.type}
              onClick={() => {
                if (feat.type === FeatureType.TEST) {
                  // Handled by hover menu
                } else {
                  runFeature(feat.type);
                }
              }}
              className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 relative overflow-hidden group ${
                activeFeature === feat.type 
                  ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-200' 
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-3xl">{feat.icon}</span>
              <span className="font-bold text-slate-700">{feat.label}</span>
              
              {/* Special dropdown for Test Type */}
              {feat.type === FeatureType.TEST && (
                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs font-bold text-slate-400 mb-2">TYPE TEST</p>
                  <button onClick={(e) => { e.stopPropagation(); runFeature(FeatureType.TEST, TestType.MULTIPLE_CHOICE); }} className="text-xs font-bold text-indigo-600 py-2 hover:underline">Meerkeuze</button>
                  <button onClick={(e) => { e.stopPropagation(); runFeature(FeatureType.TEST, TestType.OPEN_QUESTIONS); }} className="text-xs font-bold text-indigo-600 py-2 hover:underline">Open vragen</button>
                </div>
              )}
            </button>
          ))}
        </section>

        {/* Display Content Section */}
        <section className="min-h-[400px]">
          {!extractedText && !isProcessing && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300 italic border-2 border-dashed border-slate-100 rounded-3xl">
              <span className="text-5xl mb-4">📂</span>
              <p>Upload een bestand om aan de slag te gaan</p>
            </div>
          )}

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-6 text-slate-600 font-medium text-center">De AI analyseert <strong>{fileName}</strong> voor jou...<br/><span className="text-sm font-normal text-slate-400">Illustraties worden gegenereerd...</span></p>
              <p className="text-xs text-slate-400 mt-2">Dit kan enkele seconden duren.</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeFeature === FeatureType.SUMMARY && summaryData && (
                <div className="space-y-8">
                  {/* Summary Header */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                      <h3 className="text-3xl font-black text-slate-900">{summaryData.title}</h3>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest border border-indigo-100">Studiegids: {level}</span>
                    </div>
                    <p className="text-lg text-slate-600 leading-relaxed italic">{summaryData.introduction}</p>
                  </div>

                  {/* Summary Sections */}
                  <div className="grid grid-cols-1 gap-8">
                    {summaryData.sections.map((section, idx) => (
                      <div key={idx} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                        <div className="p-8 flex-grow">
                          <h4 className="text-2xl font-bold text-indigo-600 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-black">{idx + 1}</span>
                            {section.title}
                          </h4>
                          <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">{section.content}</p>
                          
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/50">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Kernpunten</h5>
                            <ul className="space-y-2">
                              {section.keyPoints.map((kp, kidx) => (
                                <li key={kidx} className="flex items-start gap-2 text-slate-600">
                                  <span className="text-indigo-400 mt-1">•</span>
                                  {kp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Side Illustration */}
                        <div className="w-full md:w-80 lg:w-96 bg-slate-50 flex items-center justify-center p-4 border-l border-slate-100">
                          {summaryImages[idx] ? (
                            <div className="space-y-2">
                              <img 
                                src={summaryImages[idx]} 
                                alt={section.title} 
                                className="rounded-xl shadow-md w-full h-auto object-cover border-4 border-white"
                              />
                              <p className="text-[10px] text-center text-slate-400 italic">Door AI gegenereerde illustratie</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3 py-12 px-8 text-center">
                              <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                              <p className="text-xs text-slate-400">Illustratie laden...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Conclusion */}
                  <div className="bg-indigo-600 p-8 rounded-2xl text-white shadow-xl shadow-indigo-100">
                    <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.827a1 1 0 00-.788 0l-7 3a1 1 0 000 1.846l7 3a1 1 0 00.788 0l7-3a1 1 0 000-1.846l-7-3z" /><path d="M4.394 12.115l3.82 1.636a2.001 2.001 0 001.572 0l3.82-1.636 4.403 1.887a1 1 0 000 1.846l-7 3a1 1 0 00-.788 0l-7-3a1 1 0 000-1.846l4.403-1.887z" /></svg>
                      Conclusie & Samenvattend Overzicht
                    </h4>
                    <p className="text-indigo-50 leading-relaxed font-medium">{summaryData.conclusion}</p>
                  </div>
                </div>
              )}

              {activeFeature === FeatureType.MINDMAP && mindmapData && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-xl font-bold text-slate-800">Mindmap over de tekst</h3>
                    <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 uppercase">Bron: {fileName}</span>
                  </div>
                  <Mindmap data={mindmapData} />
                </div>
              )}

              {activeFeature === FeatureType.GLOSSARY && glossary.length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-2xl font-bold text-indigo-600">Belangrijke Begrippen</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">Bron: {fileName}</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {glossary.map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
                        <dt className="font-bold text-indigo-600 mb-1">{item.term}</dt>
                        <dd className="text-slate-600 text-sm leading-relaxed">{item.definition}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeFeature === FeatureType.FLASHCARDS && flashcards.length > 0 && (
                <div className="space-y-8">
                  <div className="flex flex-col items-center gap-2">
                    <h3 className="text-2xl font-bold text-center text-indigo-600">Oefen met Steekkaarten</h3>
                    <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 uppercase tracking-tight">Bronmateriaal: {fileName}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {flashcards.map((card, idx) => (
                      <FlashcardComponent key={idx} card={card} />
                    ))}
                  </div>
                </div>
              )}

              {activeFeature === FeatureType.TEST && testQuestions.length > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-2xl font-bold text-indigo-600">Oefentoets: {testQuestions[0].type}</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">Inhoud: {fileName}</span>
                  </div>
                  
                  {!testResult ? (
                    <div className="space-y-10">
                      {testQuestions.map((q, idx) => (
                        <div key={q.id} className="space-y-4">
                          <p className="font-bold text-lg text-slate-800">{idx + 1}. {q.question}</p>
                          {q.type === TestType.MULTIPLE_CHOICE ? (
                            <div className="grid gap-3">
                              {q.options?.map((opt) => (
                                <label key={opt} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${testAnswers[q.id] === opt ? 'border-indigo-600 bg-indigo-50' : 'hover:bg-slate-50 border-slate-200'}`}>
                                  <input 
                                    type="radio" 
                                    name={q.id} 
                                    value={opt} 
                                    checked={testAnswers[q.id] === opt}
                                    onChange={(e) => setTestAnswers({ ...testAnswers, [q.id]: e.target.value })}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  <span className="text-slate-700">{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <textarea
                              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[100px]"
                              placeholder="Typ hier je antwoord op basis van de tekst..."
                              value={testAnswers[q.id] || ""}
                              onChange={(e) => setTestAnswers({ ...testAnswers, [q.id]: e.target.value })}
                            />
                          )}
                        </div>
                      ))}
                      <button
                        onClick={handleGradeTest}
                        disabled={isGrading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200"
                      >
                        {isGrading ? "De AI kijkt je antwoorden na..." : "Test Inleveren & Verbeteren"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Result Header */}
                      <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                        <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-2">Je Resultaat</p>
                        <div className="text-6xl font-black text-indigo-600 mb-4">{testResult.score} / {testResult.maxScore}</div>
                        <p className="text-slate-700 font-medium italic leading-relaxed">"{testResult.feedback}"</p>
                      </div>

                      {/* Detailed Feedback */}
                      <div className="space-y-6">
                        {testResult.gradedQuestions.map((gq, idx) => {
                          const originalQ = testQuestions.find(q => q.id === gq.questionId);
                          return (
                            <div key={idx} className={`p-6 border rounded-2xl ${gq.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                              <p className="font-bold text-slate-800 mb-4">{idx + 1}. {originalQ?.question}</p>
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-slate-500 font-semibold mb-1 uppercase text-xs">Jouw antwoord</p>
                                  <p className={`${gq.isCorrect ? 'text-green-700' : 'text-red-700'} font-medium`}>{gq.userAnswer || "(Niet ingevuld)"}</p>
                                </div>
                                {!gq.isCorrect && (
                                  <div>
                                    <p className="text-slate-500 font-semibold mb-1 uppercase text-xs">Correct volgens tekst</p>
                                    <p className="text-green-700 font-bold">{gq.correctAnswer}</p>
                                  </div>
                                )}
                              </div>
                              <div className="mt-4 pt-4 border-t border-slate-200/50">
                                <p className="text-slate-600 text-sm leading-relaxed"><span className="font-bold text-slate-800">Feedback:</span> {gq.feedback}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => { setTestResult(null); setTestAnswers({}); }}
                        className="w-full py-4 border border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                      >
                        Opnieuw Proberen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

// Sub-component: Flashcard
const FlashcardComponent: React.FC<{ card: Flashcard }> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="card-flip h-64 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`card-inner relative w-full h-full ${isFlipped ? 'card-flipped' : ''}`}>
        <div className="card-face card-front bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-center justify-center text-center">
          <p className="text-lg font-bold text-slate-800 leading-tight">{card.front}</p>
          <div className="absolute bottom-4 right-4 text-slate-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
          </div>
        </div>
        <div className="card-face card-back bg-indigo-600 border border-indigo-500 rounded-2xl shadow-sm p-6 flex items-center justify-center text-center">
          <p className="text-lg font-medium text-white leading-relaxed">{card.back}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
