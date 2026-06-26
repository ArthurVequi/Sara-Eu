import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, RotateCcw, Download, Plus, Trash2, Calendar, Image, Heart, Settings, MailOpen, Clock } from 'lucide-react';

export default function AdminPanel({ data, onSave, onReset, onClose }) {
  const [activeTab, setActiveTab] = useState('general');
  const [editedData, setEditedData] = useState(JSON.parse(JSON.stringify(data)));

  // Atualizações simples
  const handleChange = (path, value) => {
    const newData = { ...editedData };
    const keys = path.split('.');
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setEditedData(newData);
  };

  // Funções para a Timeline (Linha do Tempo)
  const handleUpdateTimeline = (index, field, value) => {
    const newData = { ...editedData };
    newData.timeline[index][field] = value;
    setEditedData(newData);
  };

  const handleAddTimelineEvent = () => {
    const newData = { ...editedData };
    const newId = newData.timeline.length > 0 ? Math.max(...newData.timeline.map(e => e.id)) + 1 : 1;
    newData.timeline.push({
      id: newId,
      date: "Nova Data",
      title: "📍 Novo Momento",
      description: "Escreva aqui a descrição deste momento especial...",
      emoji: "❤️"
    });
    setEditedData(newData);
  };

  const handleRemoveTimelineEvent = (index) => {
    const newData = { ...editedData };
    newData.timeline.splice(index, 1);
    setEditedData(newData);
  };

  // Funções para a Galeria
  const handleUpdateGallery = (index, field, value) => {
    const newData = { ...editedData };
    newData.gallery[index][field] = value;
    setEditedData(newData);
  };

  // Carregar imagem localmente e converter para Base64
  const handleImageUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpdateGallery(index, 'url', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleInvitationImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('invitation.imageUrl', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddGalleryPhoto = () => {
    const newData = { ...editedData };
    const newId = newData.gallery.length > 0 ? Math.max(...newData.gallery.map(p => p.id)) + 1 : 1;
    newData.gallery.push({
      id: newId,
      url: "/photos/photo1.jpg", // placeholder inicial
      caption: "Nova Memória ✨",
      date: "Novo Mês"
    });
    setEditedData(newData);
  };

  const handleRemoveGalleryPhoto = (index) => {
    const newData = { ...editedData };
    newData.gallery.splice(index, 1);
    setEditedData(newData);
  };

  // Exportar o arquivo coupleData.js
  const handleExport = () => {
    // Formata o objeto como arquivo JS exportável
    const fileContent = `/**
 * Dados centralizados do casal para o aplicativo Sara&Eu
 * 
 * Este arquivo foi gerado automaticamente pelo Editor Local.
 * Substitua o conteúdo de 'src/data/coupleData.js' por este conteúdo.
 */
export const coupleData = ${JSON.stringify(editedData, null, 2)};
`;

    const blob = new Blob([fileContent], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "coupleData.js");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAll = () => {
    onSave(editedData);
    alert("Alterações salvas com sucesso no navegador!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100"
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-rose-500">
            <Settings size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
            <h2 className="font-serif text-lg font-bold text-gray-800">Editor de Conteúdo (Localhost)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-gray-100 bg-gray-50 px-4 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'general' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Geral
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'timeline' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Linha do Tempo
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'gallery' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Fotos
          </button>
          <button
            onClick={() => setActiveTab('invitation')}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'invitation' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Convite
          </button>
        </div>

        {/* Conteúdo Formulário */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: GERAL (Nomes, Data de Início, Mensagem) */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <h3 className="font-sans font-bold text-gray-800 text-sm flex items-center gap-1.5"><Heart size={16} className="text-rose-500 fill-rose-500" /> Identidade & Nomes</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome Dela (Sara)</label>
                  <input
                    type="text"
                    value={editedData.names.her}
                    onChange={(e) => handleChange('names.her', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Seu Nome (Arthur)</label>
                  <input
                    type="text"
                    value={editedData.names.him}
                    onChange={(e) => handleChange('names.him', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título do Aplicativo</label>
                <input
                  type="text"
                  value={editedData.names.appTitle}
                  onChange={(e) => handleChange('names.appTitle', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              <h3 className="font-sans font-bold text-gray-800 text-sm flex items-center gap-1.5 pt-3"><Calendar size={16} className="text-rose-500" /> Data que Vocês se Conheceram (Contador Progressivo)</h3>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Dia</label>
                  <input
                    type="number"
                    value={editedData.startDate.day}
                    onChange={(e) => handleChange('startDate.day', parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 text-center text-sm border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Mês (1-12)</label>
                  <input
                    type="number"
                    value={editedData.startDate.month + 1}
                    onChange={(e) => handleChange('startDate.month', (parseInt(e.target.value) || 1) - 1)}
                    className="w-full px-2 py-1.5 text-center text-sm border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Ano</label>
                  <input
                    type="number"
                    value={editedData.startDate.year}
                    onChange={(e) => handleChange('startDate.year', parseInt(e.target.value) || 2024)}
                    className="w-full px-2 py-1.5 text-center text-sm border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Hora</label>
                  <input
                    type="number"
                    value={editedData.startDate.hour}
                    onChange={(e) => handleChange('startDate.hour', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-center text-sm border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Minuto</label>
                  <input
                    type="number"
                    value={editedData.startDate.minute}
                    onChange={(e) => handleChange('startDate.minute', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-center text-sm border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic -mt-2">Após o encontro acontecer, o widget muda para o contador progressivo usando esta data.</p>

              <h3 className="font-sans font-bold text-gray-800 text-sm flex items-center gap-1.5 pt-3"><Clock size={16} className="text-amber-500" /> Data do Próximo Encontro (Contagem Regressiva)</h3>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Dia</label>
                  <input
                    type="number"
                    value={editedData.nextMeetingDate.day}
                    onChange={(e) => handleChange('nextMeetingDate.day', parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 text-center text-sm border border-amber-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Mês (1-12)</label>
                  <input
                    type="number"
                    value={editedData.nextMeetingDate.month + 1}
                    onChange={(e) => handleChange('nextMeetingDate.month', (parseInt(e.target.value) || 1) - 1)}
                    className="w-full px-2 py-1.5 text-center text-sm border border-amber-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Ano</label>
                  <input
                    type="number"
                    value={editedData.nextMeetingDate.year}
                    onChange={(e) => handleChange('nextMeetingDate.year', parseInt(e.target.value) || 2026)}
                    className="w-full px-2 py-1.5 text-center text-sm border border-amber-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Hora</label>
                  <input
                    type="number"
                    value={editedData.nextMeetingDate.hour}
                    onChange={(e) => handleChange('nextMeetingDate.hour', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-center text-sm border border-amber-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Minuto</label>
                  <input
                    type="number"
                    value={editedData.nextMeetingDate.minute}
                    onChange={(e) => handleChange('nextMeetingDate.minute', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-center text-sm border border-amber-200 rounded-xl"
                  />
                </div>
              </div>
              <p className="text-[10px] text-amber-500/70 italic -mt-2">Enquanto esta data estiver no futuro, o widget mostra a contagem regressiva em dourado.</p>

              <h3 className="font-sans font-bold text-gray-800 text-sm flex items-center gap-1.5 pt-3">👋 Mensagem de Boas-vindas (Home)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título</label>
                  <input
                    type="text"
                    value={editedData.welcome.title}
                    onChange={(e) => handleChange('welcome.title', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Subtítulo/Texto</label>
                  <textarea
                    rows={3}
                    value={editedData.welcome.subtitle}
                    onChange={(e) => handleChange('welcome.subtitle', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE (História) */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-sans font-bold text-gray-800 text-sm">Linha do Tempo do Casal</h3>
                <button
                  onClick={handleAddTimelineEvent}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-500 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-rose-100 transition-colors"
                >
                  <Plus size={14} /> Adicionar Momento
                </button>
              </div>

              <div className="space-y-6">
                {editedData.timeline.map((event, index) => (
                  <div key={event.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-3 relative">
                    {/* Botão de Excluir */}
                    <button
                      onClick={() => handleRemoveTimelineEvent(index)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 cursor-pointer p-1 rounded-full hover:bg-gray-200"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Emoji</label>
                        <input
                          type="text"
                          value={event.emoji}
                          onChange={(e) => handleUpdateTimeline(index, 'emoji', e.target.value)}
                          className="w-full px-2 py-1.5 text-center text-sm border border-gray-200 rounded-xl bg-white"
                        />
                      </div>
                      <div className="col-span-9">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Data Escrita</label>
                        <input
                          type="text"
                          value={event.date}
                          onChange={(e) => handleUpdateTimeline(index, 'date', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título do Momento</label>
                      <input
                        type="text"
                        value={event.title}
                        onChange={(e) => handleUpdateTimeline(index, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descrição</label>
                      <textarea
                        rows={2}
                        value={event.description}
                        onChange={(e) => handleUpdateTimeline(index, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GALLERY (Fotos) */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-sans font-bold text-gray-800 text-sm flex items-center gap-1.5"><Image size={16} className="text-amber-500" /> Galeria Polaroid</h3>
                <button
                  onClick={handleAddGalleryPhoto}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <Plus size={14} /> Adicionar Foto
                </button>
              </div>

              <div className="space-y-6">
                {editedData.gallery.map((photo, index) => (
                  <div key={photo.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-4 relative flex flex-col sm:flex-row gap-4">
                    {/* Botão de Excluir */}
                    <button
                      onClick={() => handleRemoveGalleryPhoto(index)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 cursor-pointer p-1 rounded-full hover:bg-gray-200 z-10"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Preview da Foto Polaroid */}
                    <div className="w-28 h-32 bg-white p-2 border border-gray-200 rounded shadow-sm flex flex-col items-center justify-between flex-shrink-0">
                      <div className="w-full aspect-square bg-gray-50 overflow-hidden rounded border border-gray-100">
                        <img src={photo.url} alt="preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-cursive text-[10px] text-gray-500 text-center truncate w-full max-w-[80px]">{photo.caption || "Legenda"}</span>
                    </div>

                    {/* Campos de Edição */}
                    <div className="flex-1 space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Legenda Polaroid (Fonte Cursiva)</label>
                        <input
                          type="text"
                          value={photo.caption}
                          onChange={(e) => handleUpdateGallery(index, 'caption', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Data (Mês/Ano)</label>
                          <input
                            type="text"
                            value={photo.date}
                            onChange={(e) => handleUpdateGallery(index, 'date', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Caminho da Imagem</label>
                          <input
                            type="text"
                            value={photo.url.startsWith('data:image') ? "[Upload Local]" : photo.url}
                            onChange={(e) => handleUpdateGallery(index, 'url', e.target.value)}
                            disabled={photo.url.startsWith('data:image')}
                            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </div>
                      </div>

                      {/* Input de File Upload */}
                      <div>
                        <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">Selecionar Foto Real (Upload instantâneo)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(index, e.target.files[0])}
                          className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: INVITATION (Convite) */}
          {activeTab === 'invitation' && (
            <div className="space-y-5">
              <h3 className="font-sans font-bold text-gray-800 text-sm flex items-center gap-1.5"><MailOpen size={16} className="text-rose-500" /> Detalhes do Convite & Carta</h3>
              
              {/* Seção do Template de Convite (Imagem) */}
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-4">
                <label className="block text-xs font-bold text-gray-800 uppercase">Template do Convite (Imagem)</label>
                
                {editedData.invitation.imageUrl && (
                  <div className="max-w-[180px] mx-auto aspect-[3/4] bg-white p-2 border border-gray-200 rounded-xl shadow-sm overflow-hidden flex items-center justify-center">
                    <img 
                      src={editedData.invitation.imageUrl} 
                      alt="Template Preview" 
                      className="w-full h-full object-contain rounded-lg" 
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Caminho / URL da Imagem</label>
                    <input
                      type="text"
                      value={editedData.invitation.imageUrl && editedData.invitation.imageUrl.startsWith('data:image') ? "[Upload Local]" : editedData.invitation.imageUrl || ''}
                      onChange={(e) => handleChange('invitation.imageUrl', e.target.value)}
                      disabled={editedData.invitation.imageUrl && editedData.invitation.imageUrl.startsWith('data:image')}
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white disabled:bg-gray-100 disabled:text-gray-400"
                      placeholder="/invitation_template.jpg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">Selecionar Imagem (Upload instantâneo)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleInvitationImageUpload(e.target.files[0])}
                      className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título do Card do Convite</label>
                <input
                  type="text"
                  value={editedData.invitation.cardTitle}
                  onChange={(e) => handleChange('invitation.cardTitle', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Texto da Carta (Opcional se a imagem já tiver texto)</label>
                <textarea
                  rows={4}
                  value={editedData.invitation.message}
                  onChange={(e) => handleChange('invitation.message', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400 leading-relaxed whitespace-pre-line text-justify"
                  placeholder="Escreva algo se quiser mostrar texto abaixo da imagem do convite..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Texto do Botão Principal</label>
                  <input
                    type="text"
                    value={editedData.invitation.buttonText}
                    onChange={(e) => handleChange('invitation.buttonText', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tag de Sucesso ("SIM!")</label>
                  <input
                    type="text"
                    value={editedData.invitation.celebrationText}
                    onChange={(e) => handleChange('invitation.celebrationText', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Carta Surpresa Oculta (Após Aceitar)</label>
                <textarea
                  rows={4}
                  value={editedData.invitation.successMessage}
                  onChange={(e) => handleChange('invitation.successMessage', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400 leading-relaxed"
                />
              </div>
            </div>
          )}

        </div>

        {/* Rodapé de Ações */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            {/* Restaurar */}
            <button
              onClick={onReset}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 transition-colors"
              title="Restaurar dados padrões do coupleData.js"
            >
              <RotateCcw size={14} /> Resetar
            </button>
            
            {/* Exportar arquivo */}
            <button
              onClick={handleExport}
              className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-rose-100 transition-colors"
              title="Baixar arquivo coupleData.js editado para publicar"
            >
              <Download size={14} /> Exportar arquivo
            </button>
          </div>

          {/* Salvar */}
          <button
            onClick={handleSaveAll}
            className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-rose-600 shadow-[0_4px_12px_rgba(244,63,94,0.15)] transition-all"
          >
            <Save size={14} /> Salvar Alterações
          </button>
        </div>
      </motion.div>
    </div>
  );
}
