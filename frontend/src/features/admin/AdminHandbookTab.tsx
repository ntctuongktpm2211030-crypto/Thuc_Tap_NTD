import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, Trash2, Upload, Clock, FileCode, FileText, CheckCircle, Loader2, Edit3, X, Save, Layers, Utensils, Landmark, RefreshCw, Compass, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { KnowledgeEngine, type KnowledgeItem } from '../blog/KnowledgeEngine';

interface HandbookDoc {
  id: string;
  title: string;
  category: string;
  fileType: string;
  fileName?: string;
  fileSize?: string;
  content: string;
  updatedAtStr: string;
  createdAt?: string;
  isSystemKnowledge?: boolean;
}

export const AdminHandbookTab: React.FC = () => {
  const [dbDocs, setDbDocs] = useState<HandbookDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Category Filter Tab State ('all' | 'THẮNG CẢNH' | 'DI TÍCH' | 'LỄ HỘI' | 'ẨM THỰC' | 'VĂN HÓA' | 'DÂN TỘC' | 'Word' | 'JSON' | 'PDF')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Adding New Handbook
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State (New)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('am-thuc');
  const [fileType, setFileType] = useState('docx');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  // Edit Modal State
  const [editingDoc, setEditingDoc] = useState<HandbookDoc | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('am-thuc');
  const [editContent, setEditContent] = useState('');

  const fetchHandbooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/handbooks');
      if (res.data && res.data.data) {
        setDbDocs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch handbooks from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandbooks();
  }, []);

  // Combine DB Handbooks with System KnowledgeEngine Items (Exactly like User Handbook Page!)
  const combinedDocs = useMemo(() => {
    const now = new Date();
    const defaultTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    // Convert KnowledgeEngine items to HandbookDoc format
    const sysItems: KnowledgeItem[] = KnowledgeEngine.loadAll();
    const mappedSysDocs: HandbookDoc[] = sysItems.map((item) => ({
      id: `sys-${item.id}`,
      title: item.title,
      category: item.subCategory || 'VĂN HÓA',
      fileType: 'json',
      fileName: `Thư viện Cẩm nang (${item.province || 'Việt Nam'})`,
      fileSize: 'Chuẩn GeoJSON',
      content: item.content,
      updatedAtStr: defaultTimeStr,
      isSystemKnowledge: true
    }));

    // Put database documents first, then system knowledge items
    // Filter out duplicates if DB title matches sys title
    const dbTitles = new Set(dbDocs.map(d => d.title.toLowerCase().trim()));
    const uniqueSysDocs = mappedSysDocs.filter(s => !dbTitles.has(s.title.toLowerCase().trim()));

    return [...dbDocs, ...uniqueSysDocs];
  }, [dbDocs]);

  // Reset page when category or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategoryFilter, searchQuery]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const sizeInKB = (file.size / 1024).toFixed(1) + ' KB';
    setFileSize(sizeInKB);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
    setFileType(ext);

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    if (ext === 'json') {
      setCategory('JSON');
      const reader = new FileReader();
      reader.onload = (event) => {
        setContent(event.target?.result as string || '');
      };
      reader.readAsText(file);
    } else if (ext === 'docx' || ext === 'doc') {
      setCategory('Word');
      setContent(`[Nội dung tệp Word "${file.name}" - Dung lượng: ${sizeInKB}]. Cẩm nang hướng dẫn chi tiết lưu vết trên hệ thống.`);
    } else if (ext === 'pdf') {
      setCategory('PDF');
      setContent(`[Nội dung tệp PDF "${file.name}" - Dung lượng: ${sizeInKB}]. Tài liệu cẩm nang du lịch lưu vết trên hệ thống.`);
    } else {
      setCategory('Handbook');
      const reader = new FileReader();
      reader.onload = (event) => {
        setContent(event.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  const handleAddHandbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung cẩm nang.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    try {
      const res = await api.post('/admin/handbooks', {
        title,
        category,
        fileType,
        fileName: fileName || null,
        fileSize: fileSize || null,
        content
      });

      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message || 'Đã thêm cẩm nang thành công!');
        setTitle('');
        setContent('');
        setFileName('');
        setFileSize('');
        setShowAddModal(false);
        fetchHandbooks();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Không thể lưu cẩm nang du lịch.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (doc: HandbookDoc) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditCategory(doc.category);
    setEditContent(doc.content);
  };

  const handleUpdateHandbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Tiêu đề và nội dung không được để trống.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    try {
      // If updating a system knowledge item, create a new DB record with user's edits
      if (editingDoc.id.startsWith('sys-')) {
        const res = await api.post('/admin/handbooks', {
          title: editTitle,
          category: editCategory,
          fileType: editingDoc.fileType || 'docx',
          fileName: editingDoc.fileName || null,
          fileSize: editingDoc.fileSize || null,
          content: editContent
        });
        if (res.data && res.data.success) {
          setSuccessMsg('Đã lưu bản chỉnh sửa cẩm nang hệ thống vào CSDL và cập nhật mốc thời gian!');
        }
      } else {
        const res = await api.put(`/admin/handbooks/${editingDoc.id}`, {
          title: editTitle,
          category: editCategory,
          content: editContent
        });
        if (res.data && res.data.success) {
          setSuccessMsg(res.data.message || 'Đã cập nhật cẩm nang và ghi nhận mốc thời gian thực!');
        }
      }

      setEditingDoc(null);
      fetchHandbooks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Không thể cập nhật cẩm nang.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDoc = async (id: string, titleStr: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cẩm nang "${titleStr}"?`)) return;
    if (id.startsWith('sys-')) {
      alert('Đây là tài liệu mẫu gốc của hệ thống. Bạn có thể bấm Sửa để cập nhật bản ghi mới!');
      return;
    }
    try {
      await api.delete(`/admin/handbooks/${id}`);
      fetchHandbooks();
    } catch (err) {
      alert('Không thể xóa cẩm nang này.');
    }
  };

  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('thắng cảnh') || c.includes('canh') || c.includes('landmark')) return <Compass size={16} className="text-sky-600" />;
    if (c.includes('di tích') || c.includes('tích') || c.includes('monument')) return <Landmark size={16} className="text-amber-600" />;
    if (c.includes('lễ hội') || c.includes('hội') || c.includes('festival')) return <BookOpen size={16} className="text-purple-600" />;
    if (c.includes('ẩm thực') || c.includes('thực') || c.includes('food') || c.includes('am-thuc')) return <Utensils size={16} className="text-orange-600" />;
    if (c.includes('văn hóa') || c.includes('hóa') || c.includes('culture') || c.includes('van-hoa')) return <BookOpen size={16} className="text-emerald-600" />;
    if (c.includes('dân tộc') || c.includes('tộc') || c.includes('ethnic')) return <Users size={16} className="text-indigo-600" />;
    if (c.includes('word') || c === 'docx') return <FileText size={16} className="text-blue-600" />;
    if (c.includes('json')) return <FileCode size={16} className="text-amber-600" />;
    if (c.includes('pdf')) return <BookOpen size={16} className="text-rose-600" />;
    return <BookOpen size={16} className="text-blue-600" />;
  };

  // Categories Filter tabs definition matching User Handbook Hub
  const filterTabs = [
    { id: 'all', label: 'TẤT CẢ', icon: Layers },
    { id: 'di-tich-van-hoa', label: 'DI TÍCH - VĂN HÓA', icon: Landmark },
    { id: 'le-hoi', label: 'LỄ HỘI', icon: BookOpen },
    { id: 'am-thuc', label: 'ẨM THỰC', icon: Utensils },
    { id: 'dan-toc', label: 'DÂN TỘC', icon: Users },
    { id: 'Word', label: 'File Word', icon: FileText },
    { id: 'JSON', label: 'File JSON', icon: FileCode },
    { id: 'PDF', label: 'File PDF', icon: BookOpen },
  ];

  const filteredDocs = useMemo(() => {
    return combinedDocs.filter(doc => {
      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchContent = doc.content.toLowerCase().includes(q);
        const matchCat = doc.category.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchCat) return false;
      }

      // Category filter
      if (activeCategoryFilter === 'all') return true;
      const cat = doc.category.toLowerCase();
      const filter = activeCategoryFilter.toLowerCase();
      if (filter === 'di-tich-van-hoa') return cat.includes('di tích') || cat.includes('tích') || cat.includes('monument') || cat.includes('văn hóa') || cat.includes('văn') || cat.includes('hóa') || cat.includes('culture') || cat.includes('van-hoa');
      if (filter === 'le-hoi') return cat.includes('lễ hội') || cat.includes('hội') || cat.includes('festival');
      if (filter === 'am-thuc') return cat.includes('ẩm thực') || cat.includes('ẩm') || cat.includes('thực') || cat.includes('food') || cat.includes('am-thuc');
      if (filter === 'dan-toc') return cat.includes('dân tộc') || cat.includes('tộc') || cat.includes('ethnic');
      if (filter === 'word') return cat.includes('word') || doc.fileType === 'docx' || doc.fileType === 'doc';
      if (filter === 'json') return cat.includes('json') || doc.fileType === 'json';
      if (filter === 'pdf') return cat.includes('pdf') || doc.fileType === 'pdf';
      return cat === filter;
    });
  }, [combinedDocs, activeCategoryFilter, searchQuery]);

  // Calculate Pagination
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const currentDocs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDocs.slice(start, start + itemsPerPage);
  }, [filteredDocs, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={22} /> Quản Lý Cẩm Nang & Thư Viện Du Lịch 63 Tỉnh Thành
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Tải đầy đủ cẩm nang Thắng cảnh, Di tích, Lễ hội, Ẩm thực, Văn hóa & Dân tộc chia theo trang chuẩn xác như giao diện người dùng
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHandbooks}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : 'text-blue-600'} /> Làm mới Dữ liệu
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={18} /> Thêm Cẩm Nang Mới
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
          <CheckCircle size={16} className="text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Redesigned Category Tabs Bar (Segmented Pill Container & Divider) */}
      <div className="bg-slate-100/80 p-2 rounded-2xl border border-slate-200/80 shadow-inner flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategoryFilter === tab.id;
          const isFileTab = tab.id === 'Word' || tab.id === 'JSON' || tab.id === 'PDF';
          const isFirstFileTab = tab.id === 'Word';

          const count = tab.id === 'all'
            ? combinedDocs.length
            : combinedDocs.filter(d => {
                const cat = d.category.toLowerCase();
                const filter = tab.id.toLowerCase();
                if (filter === 'di-tich-van-hoa') return cat.includes('di tích') || cat.includes('tích') || cat.includes('monument') || cat.includes('văn hóa') || cat.includes('văn') || cat.includes('hóa') || cat.includes('culture') || cat.includes('van-hoa');
                if (filter === 'le-hoi') return cat.includes('lễ hội') || cat.includes('hội');
                if (filter === 'am-thuc') return cat.includes('ẩm thực') || cat.includes('ẩm') || cat.includes('thực') || cat.includes('am-thuc');
                if (filter === 'dan-toc') return cat.includes('dân tộc') || cat.includes('tộc');
                if (filter === 'word') return cat.includes('word') || d.fileType === 'docx';
                if (filter === 'json') return cat.includes('json') || d.fileType === 'json';
                if (filter === 'pdf') return cat.includes('pdf') || d.fileType === 'pdf';
                return cat === filter;
              }).length;

          return (
            <React.Fragment key={tab.id}>
              {isFirstFileTab && (
                <div className="h-6 w-px bg-slate-300/80 mx-1.5 hidden sm:block shrink-0" />
              )}
              <button
                onClick={() => setActiveCategoryFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap uppercase tracking-wider group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                    : isFileTab
                      ? 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 shadow-sm'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-white' : 'text-blue-600 group-hover:scale-110 transition-transform'} />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 font-bold'
                  }`}
                >
                  {count}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Search Input Filter */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm cẩm nang theo tiêu đề, địa danh, tỉnh thành hoặc nội dung..."
          className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
        />
      </div>

      {/* List of Handbooks Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>Danh Sách Cẩm Nang (Trang {currentPage}/{totalPages} • Tổng {filteredDocs.length} mục)</span>
          <span className="text-[11px] text-slate-500 font-medium normal-case">Tự động ghi mốc thời gian thực (Giờ/Ngày/Tháng/Năm) khi Thêm & Sửa</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4 w-36 whitespace-nowrap">Mục / Phân loại</th>
                <th className="py-3.5 px-4">Tiêu đề cẩm nang du lịch</th>
                <th className="py-3.5 px-4 w-48 whitespace-nowrap">Nguồn dữ liệu / File</th>
                <th className="py-3.5 px-4 w-44 whitespace-nowrap">Mốc thời gian cập nhật thực</th>
                <th className="py-3.5 px-4 w-36 whitespace-nowrap text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentDocs.map((doc) => {
                // Shorten content preview to max 60 characters with trailing "..."
                const cleanContentSnippet = doc.content
                  ? (doc.content.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) + (doc.content.length > 60 ? '...' : ''))
                  : '';

                return (
                  <tr key={doc.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 font-bold">
                        {getCategoryIcon(doc.category)}
                        <span className="text-slate-800 uppercase text-[11px]">{doc.category}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-extrabold text-slate-900 line-clamp-1">{doc.title}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5 font-medium" title={doc.content}>{cleanContentSnippet}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap max-w-[200px] truncate">
                      {doc.fileName ? (
                        <span className="font-mono text-blue-600 font-semibold truncate block" title={doc.fileName}>{doc.fileName}</span>
                      ) : (
                        <span className="text-slate-400">Văn bản trực tiếp</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-[11px] whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <Clock size={13} className="text-emerald-600" />
                        {doc.updatedAtStr}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => openEditModal(doc)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors cursor-pointer border border-blue-200/60 font-bold text-[11px] inline-flex items-center gap-1"
                        title="Sửa cẩm nang này & Cập nhật mốc thời gian"
                      >
                        <Edit3 size={13} /> Sửa & Cập nhật
                      </button>
                      {!doc.isSystemKnowledge && (
                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.title)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer border border-rose-200/60"
                          title="Xóa cẩm nang"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {currentDocs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    {loading ? 'Đang tải toàn bộ dữ liệu cẩm nang du lịch...' : 'Chưa có cẩm nang du lịch nào thuộc mục này.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (Phân Trang Như Người Dùng) */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredDocs.length)} trong số {filteredDocs.length} cẩm nang
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Trước
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 3 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40 flex items-center gap-1"
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Popup: Add New Handbook (+ Thêm Cẩm Nang Mới) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xl space-y-4 relative animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200/80">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="text-blue-600" size={20} /> Thêm Cẩm Nang / Tài Liệu Du Lịch Mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddHandbook} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600">Tiêu đề cẩm nang / tài liệu</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Cẩm nang ăn uống Đêm Phố Cổ Hà Nội 2026..."
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Định dạng / Thể loại</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="di-tich-van-hoa">DI TÍCH - VĂN HÓA</option>
                    <option value="am-thuc">ẨM THỰC</option>
                    <option value="le-hoi">LỄ HỘI</option>
                    <option value="dan-toc">DÂN TỘC</option>
                    <option value="Word">File Word (.docx)</option>
                    <option value="JSON">File JSON (.json)</option>
                    <option value="PDF">File PDF (.pdf)</option>
                  </select>
                </div>
              </div>

              {/* File Upload Trigger */}
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                    <Upload size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Tải lên từ tệp (Word `.docx`, `.json`, `.pdf`)</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {fileName ? `Đã chọn: ${fileName} (${fileSize})` : 'Chọn file từ máy tính để tự động trích xuất nội dung'}
                    </div>
                  </div>
                </div>
                <label className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm">
                  Chọn File
                  <input type="file" accept=".docx,.doc,.json,.pdf,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Nội dung cẩm nang / tài liệu</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập hoặc dán nội dung cẩm nang chi tiết tại đây..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <><Loader2 size={15} className="animate-spin" /> Đang lưu cẩm nang...</>
                  ) : (
                    <><Plus size={15} /> Thêm Cẩm Nang & Ghi Mốc Thời Gian</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Popup: Edit Handbook (Sửa & Cập Nhật) */}
      {editingDoc && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xl space-y-4 relative animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200/80">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="text-blue-600" size={18} /> Chỉnh Sửa Cẩm Nang & Cập Nhật Mốc Thời Gian Thực
              </h3>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateHandbook} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Tiêu đề cẩm nang</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Thể loại / Phân loại</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="di-tich-van-hoa">DI TÍCH - VĂN HÓA</option>
                  <option value="am-thuc">ẨM THỰC</option>
                  <option value="le-hoi">LỄ HỘI</option>
                  <option value="dan-toc">DÂN TỘC</option>
                  <option value="Word">File Word (.docx)</option>
                  <option value="JSON">File JSON (.json)</option>
                  <option value="PDF">File PDF (.pdf)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Nội dung cẩm nang</label>
                <textarea
                  rows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-semibold text-emerald-800 flex items-center gap-2">
                <Clock size={14} className="text-emerald-600" /> Hệ thống sẽ tự động cập nhật mốc thời gian thực hiện tại (Giờ:Phút Ngày/Tháng/Năm) vào CSDL.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <><Loader2 size={14} className="animate-spin" /> Đang cập nhật...</>
                  ) : (
                    <><Save size={14} /> Lưu Cập Nhật & Ghi Mốc Thời Gian</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHandbookTab;
