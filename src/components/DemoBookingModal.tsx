import React, { useState } from 'react';
import { triggerConfetti } from '../utils/confetti';
import { X, CheckCircle2, Calendar, Clock, User, Phone, Mail, Sparkles, BookOpen } from 'lucide-react';
import { CountryCode } from '../types';

interface DemoBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCountry?: CountryCode;
  onOpenPortal: () => void;
}

export const DemoBookingModal: React.FC<DemoBookingModalProps> = ({
  isOpen,
  onClose,
  initialCountry = 'usa',
  onOpenPortal
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [grade, setGrade] = useState('Grade 6 to 8 (Middle School)');
  const [country, setCountry] = useState<CountryCode>(initialCountry === 'all' ? 'usa' : initialCountry);
  const [subject, setSubject] = useState('Mathematics & Problem Solving');
  const [preferredDate, setPreferredDate] = useState('Tomorrow');
  const [preferredTime, setPreferredTime] = useState('5:00 PM - 6:00 PM');
  const [parentName, setParentName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Keep this AFTER all hooks. Returning before a hook runs changes the hook count between
  // renders and React crashes the whole page ("Rendered more hooks than during the previous render").
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parentName,
          student_name: studentName,
          email,
          phone,
          grade,
          country,
          subject,
          message: `Preferred slot: ${preferredDate}, ${preferredTime}`,
          source: 'Website Demo Booking'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Could not submit. Please try again.');

      setIsConfirmed(true);
      try {
        triggerConfetti();
      } catch (err) {
        // ignore
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsConfirmed(false);
    setSubmitError(null);
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#140b33] border border-indigo-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-indigo-900/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isConfirmed ? (
          <div className="text-center py-6 space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-white">Free Demo Confirmed!</h3>
              <p className="text-sm text-slate-300">
                We have assigned an accredited educator for <span className="text-amber-400 font-semibold">{studentName || 'your child'}</span>.
              </p>
            </div>

            {/* Booking Details Card */}
            <div className="p-4 rounded-2xl bg-[#1b1043] border border-indigo-800 text-left text-xs space-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-indigo-900/60">
                <span className="text-slate-400">Subject:</span>
                <span className="font-semibold text-white">{subject}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-indigo-900/60">
                <span className="text-slate-400">Grade &amp; Region:</span>
                <span className="font-semibold text-white">{grade} &bull; {country.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-indigo-900/60">
                <span className="text-slate-400">Session Timing:</span>
                <span className="font-semibold text-amber-300">{preferredDate} at {preferredTime}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Confirmation Sent To:</span>
                <span className="font-semibold text-white">{email || phone || 'Registered Contact'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Our academic counselor will reach out on WhatsApp to share the 1:1 classroom video link and starter diagnostic worksheet.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  handleResetAndClose();
                  onOpenPortal();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all shadow-md shadow-amber-500/20"
              >
                Preview Student Portal &rarr;
              </button>

              <button
                onClick={handleResetAndClose}
                className="py-3 px-4 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-slate-300 font-semibold text-xs border border-indigo-700/60 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Header with step pill */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wide mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero-Commitment &bull; 100% Free 1:1 Class</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">Book a Free 1:1 Demo</h2>
              <p className="text-xs text-slate-400 mt-1">
                Tell us the grade and subject. We match the right educator for your child.
              </p>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-amber-400' : 'bg-indigo-900'}`}
              />
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-amber-400' : 'bg-indigo-900'}`}
              />
              <button
                type="button"
                onClick={() => setStep(3)}
                className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 3 ? 'bg-amber-400' : 'bg-indigo-900'}`}
              />
            </div>

            {/* Step 1: Grade & Country */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Student Grade Band</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option>Grade 1 to 3 (Early Primary)</option>
                    <option>Grade 4 to 5 (Upper Primary)</option>
                    <option>Grade 6 to 8 (Middle School)</option>
                    <option>Grade 9 to 10 (Secondary / IGCSE / Boards)</option>
                    <option>Grade 11 to 12 (Senior / SAT / HSC / JEE)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Curriculum / Country Region</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value as CountryCode)}
                    className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="usa">🇺🇸 USA (Common Core / AP / SAT)</option>
                    <option value="canada">🇨🇦 Canada (Ontario / BC / Alberta)</option>
                    <option value="uk">🇬🇧 UK (GCSE / A-Levels / 11+)</option>
                    <option value="india">🇮🇳 India (CBSE / ICSE / IIT-JEE / NEET)</option>
                    <option value="australia">🇦🇺 Australia (NAPLAN / ICAS / HSC / VCE)</option>
                    <option value="international">🌐 International (IB Diploma / Cambridge)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all"
                >
                  Continue to Select Subject &rarr;
                </button>
              </div>
            )}

            {/* Step 2: Subject & Schedule */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Subject of Interest</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option>Mathematics &amp; Problem Solving</option>
                    <option>Science (Physics, Chemistry, Biology)</option>
                    <option>English &amp; Reading Comprehension</option>
                    <option>Exam Prep (NAPLAN / SAT / Boards / JEE)</option>
                    <option>Vedic Maths (Fast Mental Arithmetic)</option>
                    <option>Coding &amp; AI for Kids</option>
                    <option>Public Speaking &amp; Debate</option>
                    <option>Daily Homework Support</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Preferred Day</span>
                    </label>
                    <select
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option>Today Evening</option>
                      <option>Tomorrow</option>
                      <option>This Weekend</option>
                      <option>Next Week</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Preferred Slot</span>
                    </label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option>4:00 PM - 5:00 PM</option>
                      <option>5:00 PM - 6:00 PM</option>
                      <option>6:00 PM - 7:00 PM</option>
                      <option>7:00 PM - 8:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-2.5 px-4 rounded-xl bg-indigo-900/60 text-slate-300 font-semibold text-xs border border-indigo-700"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all"
                  >
                    Next: Parent Contact Details &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Contact Details */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Parent Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Student Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">WhatsApp / Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 90314 00899 / +1 (555) 019-2831"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="parent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {submitError && (
                  <div className="text-xs text-red-300 bg-red-950/50 border border-red-800/60 rounded-lg px-3 py-2">
                    {submitError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-2.5 px-4 rounded-xl bg-indigo-900/60 text-slate-300 font-semibold text-xs border border-indigo-700"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wide transition-all shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Matching Vetted Tutor...' : 'Confirm Free 1:1 Demo'}
                  </button>
                </div>
              </div>
            )}

          </form>
        )}
      </div>
    </div>
  );
};
