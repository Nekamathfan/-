import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  Share,
  Image, // КИТОБХОНАИ РАСМ ИЛОВА ШУД
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAYS_OF_WEEK = ['Якшанбе', 'Душанбе', 'Сешанбе', 'Чоршанбе', 'Панҷшанбе', 'Ҷумъа', 'Шанбе'];
const MONTHS = ['Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн', 'Июл', 'Август', 'Сентябр', 'Октябр', 'Ноябр', 'Декабр'];

export default function App() {
  const [classes, setClasses] = useState([
    {
      id: '1',
      name: '10 "А"',
      students: [
        { id: 's1', name: 'Гадоев Некрӯз' },
        { id: 's2', name: 'Каримов Фаридун' },
        { id: 's3', name: 'Саидова Нигина' },
        { id: 's4', name: 'Алиев Алишер' },
      ],
    },
  ]);
  const [selectedClassId, setSelectedClassId] = useState('1');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(1);

  const [schedules, setSchedules] = useState({
    1: {
      1: ['Алгебра', 'Физика', 'Химия', 'Адабиёт', 'Таърих', 'Заб. англисӣ', 'Тарб. ҷисмонӣ'],
      2: ['Геометрия', 'Биология', 'Адабиёт', 'Заб. тоҷикӣ', 'Химия', 'Информатика'],
      3: ['Физика', 'Алгебра', 'Таърих', 'Заб. англисӣ', 'Биология', 'Тарб. ҷисмонӣ', 'Суруд'],
      4: ['Химия', 'Адабиёт', 'Геометрия', 'Физика', 'Заб. тоҷикӣ', 'География', 'Технология'],
      5: ['Алгебра', 'Заб. англисӣ', 'Информатика', 'Таърих', 'Биология', 'Адабиёт'],
      6: ['Геометрия', 'Физика', 'Химия', 'Заб. тоҷикӣ'],
    },
  });

  const [attendance, setAttendance] = useState({});

  const [classModalVisible, setClassModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false); 

  const [newClassName, setNewClassName] = useState('');
  const [singleStudentName, setSingleStudentName] = useState('');
  const [excelText, setExcelText] = useState('');
  
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedClasses = await AsyncStorage.getItem('@classes_data');
      const savedAttendance = await AsyncStorage.getItem('@attendance_data');
      const savedSchedules = await AsyncStorage.getItem('@schedules_data');
      if (savedClasses) setClasses(JSON.parse(savedClasses));
      if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
      if (savedSchedules) setSchedules(JSON.parse(savedSchedules));
    } catch (e) {
      console.log('Боркунии маълумот хато кард');
    }
  };

  const saveData = async (newClasses, newAtt, newSched) => {
    try {
      if (newClasses) await AsyncStorage.setItem('@classes_data', JSON.stringify(newClasses));
      if (newAtt) await AsyncStorage.setItem('@attendance_data', JSON.stringify(newAtt));
      if (newSched) await AsyncStorage.setItem('@schedules_data', JSON.stringify(newSched));
    } catch (e) {
      console.log('Сабти маълумот хато кард');
    }
  };

  const getFormattedDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dateString;
  };

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const currentDayIndex = new Date(selectedDate).getDay();
  const todaySchedule = schedules[selectedClassId]?.[currentDayIndex] || [];
  const maxPeriodsToday = todaySchedule.length || 1;

  useEffect(() => {
    if (selectedPeriod > maxPeriodsToday) {
      setSelectedPeriod(maxPeriodsToday);
    }
  }, [maxPeriodsToday, selectedPeriod]);

  const handleNextPeriod = () => {
    setSelectedPeriod((prev) => (prev % maxPeriodsToday) + 1);
  };

  const handleAttendanceToggle = (studentId, type) => {
    setAttendance((prev) => {
      const dateAtt = prev[selectedDate] || {};
      const classAtt = dateAtt[selectedClassId] || {};
      const currentPeriodAtt = classAtt[selectedPeriod] || {};
      const currentStatus = currentPeriodAtt[studentId];
      const updatedClassAtt = { ...classAtt };

      if (currentStatus === type) {
        for (let p = selectedPeriod; p <= maxPeriodsToday; p++) {
          const pAtt = { ...(updatedClassAtt[p] || {}) };
          if (pAtt[studentId] === type) delete pAtt[studentId];
          updatedClassAtt[p] = pAtt;
        }
      } else {
        for (let p = selectedPeriod; p <= maxPeriodsToday; p++) {
          const pAtt = { ...(updatedClassAtt[p] || {}) };
          pAtt[studentId] = type;
          updatedClassAtt[p] = pAtt;
        }
      }

      const newTotal = { ...prev, [selectedDate]: { ...dateAtt, [selectedClassId]: updatedClassAtt } };
      saveData(null, newTotal, null);
      return newTotal;
    });
  };

  const getStudentStatus = (studentId) => {
    return attendance[selectedDate]?.[selectedClassId]?.[selectedPeriod]?.[studentId] || null;
  };

  const adjustPeriods = (dayIdx, amount) => {
    setSchedules((prev) => {
      const cSched = { ...(prev[selectedClassId] || {}) };
      let dayArr = [...(cSched[dayIdx] || [])];
      if (amount === 1) dayArr.push(''); 
      else if (amount === -1 && dayArr.length > 0) dayArr.pop(); 
      cSched[dayIdx] = dayArr;
      const updated = { ...prev, [selectedClassId]: cSched };
      saveData(null, null, updated);
      return updated;
    });
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const newCls = { id: Date.now().toString(), name: newClassName.trim(), students: [] };
    setClasses([...classes, newCls]);
    setSelectedClassId(newCls.id);
    setNewClassName('');
    saveData([...classes, newCls], null, null);
  };

  const handleDeleteClass = (id) => {
    if (classes.length <= 1) { Alert.alert('Огоҳӣ', 'Синф бояд бошад!'); return; }
    const updated = classes.filter((c) => c.id !== id);
    setClasses(updated);
    setSelectedClassId(updated[0].id);
    saveData(updated, null, null);
  };

  const handleAddSingleStudent = () => {
    if (!singleStudentName.trim() || !currentClass) return;
    const newSt = { id: Date.now().toString(), name: singleStudentName.trim() };
    const updated = classes.map((c) => c.id === currentClass.id ? { ...c, students: [...c.students, newSt] } : c);
    setClasses(updated);
    setSingleStudentName('');
    saveData(updated, null, null);
  };

  const handleImportExcel = () => {
    if (!excelText.trim() || !currentClass) return;
    const lines = excelText.split('\n');
    const newStudents = [];
    lines.forEach((line) => {
      const clean = line.replace(/^[0-9]+[\.\)\s]+/, '').trim();
      if (clean.length > 2) newStudents.push({ id: Math.random().toString(), name: clean });
    });
    if (newStudents.length === 0) return;
    const updated = classes.map((c) => c.id === currentClass.id ? { ...c, students: [...c.students, ...newStudents] } : c);
    setClasses(updated);
    setExcelText('');
    Alert.alert('Муваффақият', `${newStudents.length} хонанда илова шуд!`);
    saveData(updated, null, null);
  };

  const calculateMonthlyReport = () => {
    if (!currentClass) return [];
    const targetMonth = selectedDate.substring(0, 7);
    const report = {};
    currentClass.students.forEach((s) => { report[s.id] = { name: s.name, sbHours: 0, bsbHours: 0 }; });
    Object.keys(attendance).forEach((dateStr) => {
      if (dateStr.startsWith(targetMonth)) {
        const dayClassAtt = attendance[dateStr]?.[selectedClassId] || {};
        for (let p = 1; p <= 10; p++) {
          const pAtt = dayClassAtt[p] || {};
          Object.keys(pAtt).forEach((stId) => {
            if (report[stId]) {
              if (pAtt[stId] === 'SB') report[stId].sbHours += 1;
              if (pAtt[stId] === 'BSB') report[stId].bsbHours += 1;
            }
          });
        }
      }
    });
    return Object.values(report);
  };

  const handleExportToExcel = async () => {
    try {
      const reportData = calculateMonthlyReport();
      const targetMonth = selectedDate.substring(0, 7);
      let content = `ҲИСОБОТИ ДАВОМОТ: Синфи ${currentClass?.name} (${targetMonth})\n`;
      content += `Мактаб: ЛБХБ Турсунзода\n---------------------------------\n`;
      content += `№ | Ному насаб | СБ (соат) | БСБ (соат) | Ҷамъ\n---------------------------------\n`;
      reportData.forEach((item, index) => {
        const total = item.sbHours + item.bsbHours;
        content += `${index + 1}. ${item.name} | ${item.sbHours} с. | ${item.bsbHours} с. | ${total} с.\n`;
      });
      content += `\nФормати CSV барои гузоштан ба Excel:\n№,Ному насаб,СБ,БСБ,Ҷамъ\n`;
      reportData.forEach((item, index) => {
        const total = item.sbHours + item.bsbHours;
        content += `${index + 1},"${item.name}",${item.sbHours},${item.bsbHours},${total}\n`;
      });
      await Share.share({ message: content, title: `Ҳисобот - ${currentClass?.name}` });
    } catch (error) { Alert.alert('Хатогӣ', error.message); }
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calMonth, calYear);
    const firstDay = getFirstDayOfMonth(calMonth, calYear);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };
  const handleDaySelect = (day) => {
    if (!day) return;
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setSelectedDate(`${calYear}-${mm}-${dd}`);
    setCalendarModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3c72" />

      {/* --- ҚИСМАТИ БОЛОӢ БО ЛОГОТИП ВА НОМИ МАКТАБ --- */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Диққат: Агар расмро дар assets намонда бошед, рамзи зерро хомӯш кунед, то барнома хато надиҳад */}
          <Image 
            source={require('./assets/logo.jpg')} // ЛОГОТИПИ ШУМО
            style={styles.logo} 
            resizeMode="cover"
          />
          <Text style={styles.headerTitle}>ЛБХБ ТУРСУНЗОДА</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.mainBtn} onPress={() => setClassModalVisible(true)}>
          <Text style={styles.mainBtnSmall}>Синф:</Text>
          <Text style={styles.mainBtnText}>{currentClass?.name || 'Интихоб'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainBtn} onPress={() => {
            const parts = selectedDate.split('-');
            setCalYear(parseInt(parts[0])); setCalMonth(parseInt(parts[1]) - 1);
            setCalendarModalVisible(true);
        }}>
          <Text style={styles.mainBtnSmall}>Сана:</Text>
          <Text style={styles.mainBtnText}>📅 {getFormattedDate(selectedDate)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainBtn} onPress={handleNextPeriod}>
          <Text style={styles.mainBtnSmall}>Соат:</Text>
          <Text style={styles.mainBtnText}>⏰ {selectedPeriod}-юм дарс</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scheduleBox}>
        <Text style={styles.scheduleDayTitle}>
          {DAYS_OF_WEEK[currentDayIndex]} (Соати {selectedPeriod}:{' '}
          <Text style={{ color: '#1e3c72', fontWeight: 'bold' }}>
            {todaySchedule[selectedPeriod - 1] || 'Дарс муайян нест'}
          </Text>)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          {todaySchedule.length > 0 ? (
            todaySchedule.map((subj, idx) => (
              <TouchableOpacity
                key={idx} onPress={() => setSelectedPeriod(idx + 1)}
                style={[styles.subjBadge, selectedPeriod === idx + 1 && styles.subjBadgeActive]}
              >
                <Text style={[styles.subjText, selectedPeriod === idx + 1 && styles.subjTextActive]}>
                  {idx + 1}. {subj}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noScheduleText}>Ҷадвал ворид нашудааст</Text>
          )}
        </ScrollView>
      </View>

      <FlatList
        data={currentClass?.students || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 6 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#777', fontSize: 15 }}>Хонанда илова кунед.</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const status = getStudentStatus(item.id);
          const isSB = status === 'SB';
          const isBSB = status === 'BSB';

          return (
            <View style={styles.studentCard}>
              <View style={[styles.studentNameContainer, isSB && styles.bgGreen, isBSB && styles.bgRed]}>
                <Text style={[styles.studentIndex, (isSB || isBSB) && styles.textWhite]}>{index + 1}.</Text>
                <Text style={[styles.studentName, (isSB || isBSB) && styles.textWhite]} numberOfLines={1}>{item.name}</Text>
              </View>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity style={[styles.btnSB, isSB && styles.btnSBActive]} onPress={() => handleAttendanceToggle(item.id, 'SB')}>
                  <Text style={[styles.btnTextSB, isSB && styles.btnTextActive]}>СБ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnBSB, isBSB && styles.btnBSBActive]} onPress={() => handleAttendanceToggle(item.id, 'BSB')}>
                  <Text style={[styles.btnTextBSB, isBSB && styles.btnTextActive]}>БСБ</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.beautifulBottomBar}>
        <TouchableOpacity style={[styles.beautifulBtn, { backgroundColor: '#505d6e' }]} onPress={() => setScheduleModalVisible(true)}>
          <Text style={styles.beautifulBtnText}>Ҷадвал 📚</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.beautifulBtn, { backgroundColor: '#1e3b6d' }]} onPress={() => setReportModalVisible(true)}>
          <Text style={styles.beautifulBtnText}>Ҳисобот 📊</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.beautifulBtn, { backgroundColor: '#187944' }]} onPress={handleExportToExcel}>
          <Text style={styles.beautifulBtnText}>Ба Excel 📥</Text>
        </TouchableOpacity>
      </View>

      {/* --- МОДАЛИ ТАҲРИРИ ҶАДВАЛ --- */}
      <Modal visible={scheduleModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ҷадвал: {currentClass?.name}</Text>
            <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[1, 2, 3, 4, 5, 6].map((dayIdx) => {
              const dayArr = schedules[selectedClassId]?.[dayIdx] || [];
              return (
                <View key={dayIdx} style={{ marginBottom: 20 }}>
                  <View style={styles.dayHeaderRow}>
                    <Text style={styles.dayHeaderTitle}>{DAYS_OF_WEEK[dayIdx]}</Text>
                    <View style={styles.periodAdjustContainer}>
                      <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustPeriods(dayIdx, -1)}>
                        <Text style={styles.adjustBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.periodCountText}>{dayArr.length} дарс</Text>
                      <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustPeriods(dayIdx, 1)}>
                        <Text style={styles.adjustBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {dayArr.map((val, pIndex) => (
                    <View key={pIndex} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                      <Text style={{ width: 65, color: '#555', fontSize: 13, fontWeight: '500' }}>Соати {pIndex + 1}:</Text>
                      <TextInput
                        style={[styles.input, { height: 38, fontSize: 14 }]}
                        placeholder={`Фанни ${pIndex + 1}`}
                        value={val}
                        onChangeText={(txt) => {
                          setSchedules((prev) => {
                            const cSched = { ...(prev[selectedClassId] || {}) };
                            const newDayArr = [...(cSched[dayIdx] || [])];
                            newDayArr[pIndex] = txt;
                            cSched[dayIdx] = newDayArr;
                            return { ...prev, [selectedClassId]: cSched };
                          });
                        }}
                      />
                    </View>
                  ))}
                  {dayArr.length === 0 && (
                    <Text style={{ color: '#999', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
                      Дар ин рӯз дарс муайян нашудааст.
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* --- КАЛЕНДАР --- */}
      <Modal visible={calendarModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarCard}>
            <View style={styles.calHeader}>
              <Text style={styles.calYearText}>{calYear}</Text>
              <Text style={styles.calMonthText}>{MONTHS[calMonth]}, {calYear}</Text>
            </View>
            <View style={styles.calControls}>
              <TouchableOpacity onPress={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} style={{ padding: 10 }}>
                <Text style={styles.calArrow}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.calMonthLabel}>{MONTHS[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} style={{ padding: 10 }}>
                <Text style={styles.calArrow}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calDaysRow}>
              {['Я', 'Д', 'С', 'Ч', 'П', 'Ҷ', 'Ш'].map((d, i) => <Text key={i} style={styles.calDayLabel}>{d}</Text>)}
            </View>
            <View style={styles.calGrid}>
              {generateCalendarDays().map((day, idx) => (
                <TouchableOpacity key={idx} style={[styles.calDayCell, day && selectedDate === `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` && styles.calDayActive]} onPress={() => handleDaySelect(day)} disabled={!day}>
                  <Text style={[styles.calDayText, day && selectedDate === `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` && styles.calDayTextActive]}>{day || ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.calFooter}>
              <TouchableOpacity onPress={() => setCalendarModalVisible(false)} style={{ padding: 10 }}><Text style={styles.calCancelBtn}>БЕКОР КАРДАН</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- СИНФҲО ВА ҲИСОБОТ --- */}
      <Modal visible={classModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Синфҳо</Text><TouchableOpacity onPress={() => setClassModalVisible(false)}><Text style={{ fontSize: 20, fontWeight: 'bold' }}>✕</Text></TouchableOpacity></View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {classes.map((cls) => (
                <View key={cls.id} style={{ flexDirection: 'row', alignItems: 'center', margin: 4 }}>
                  <TouchableOpacity style={[styles.classChip, cls.id === selectedClassId && styles.classChipActive]} onPress={() => setSelectedClassId(cls.id)}>
                    <Text style={[styles.classChipText, cls.id === selectedClassId && styles.classChipTextActive]}>{cls.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteClass(cls.id)} style={{ padding: 4 }}><Text style={{ color: 'red', fontWeight: 'bold' }}>✕</Text></TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 18 }}>
              <TextInput style={styles.input} placeholder="Синфи нав..." value={newClassName} onChangeText={setNewClassName}/>
              <TouchableOpacity style={styles.actionSmallBtn} onPress={handleAddClass}><Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Илова</Text></TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <TextInput style={styles.input} placeholder="Номи хонанда..." value={singleStudentName} onChangeText={setSingleStudentName}/>
              <TouchableOpacity style={styles.actionSmallBtn} onPress={handleAddSingleStudent}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Илова</Text></TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <TextInput style={[styles.input, { height: 110, textAlignVertical: 'top' }]} multiline placeholder={'Аз Excel гузоред...'} value={excelText} onChangeText={setExcelText}/>
            <TouchableOpacity style={[styles.bigBtn, { marginTop: 8 }]} onPress={handleImportExcel}><Text style={styles.bigBtnText}>Ворид кардан</Text></TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={reportModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Ҳисобот</Text><TouchableOpacity onPress={() => setReportModalVisible(false)}><Text style={{ fontSize: 20, fontWeight: 'bold' }}>✕</Text></TouchableOpacity></View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol, { flex: 2, fontWeight: 'bold' }]}>Ному насаб</Text>
            <Text style={[styles.tableCol, { color: '#27ae60', fontWeight: 'bold' }]}>СБ</Text>
            <Text style={[styles.tableCol, { color: '#e74c3c', fontWeight: 'bold' }]}>БСБ</Text>
            <Text style={[styles.tableCol, { fontWeight: 'bold' }]}>Ҷамъ</Text>
          </View>
          <FlatList
            data={calculateMonthlyReport()} keyExtractor={(item, idx) => idx.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, { flex: 2, textAlign: 'left' }]} numberOfLines={1}>{index + 1}. {item.name}</Text>
                <Text style={[styles.tableCol, { color: '#27ae60', fontWeight: 'bold' }]}>{item.sbHours}</Text>
                <Text style={[styles.tableCol, { color: '#e74c3c', fontWeight: 'bold' }]}>{item.bsbHours}</Text>
                <Text style={[styles.tableCol, { fontWeight: 'bold' }]}>{item.sbHours + item.bsbHours}</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  
  // УСЛУБИ НАВИ ҚИСМИ БОЛОӢ БО ЛОГО
  header: { 
    backgroundColor: '#1e3c72', 
    paddingVertical: 14, 
    alignItems: 'center', 
    elevation: 4 
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18, // Гирд кардани логотип
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#f1c40f', // Ҳалқаи тиллоӣ дар атрофи лого
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#f1c40f', letterSpacing: 1.2 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: '#e1e5eb' },
  mainBtn: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 4, marginHorizontal: 3, alignItems: 'center' },
  mainBtnSmall: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  mainBtnText: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginTop: 1 },
  scheduleBox: { backgroundColor: '#ffffff', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  scheduleDayTitle: { fontSize: 13, fontWeight: '600', color: '#475569' },
  noScheduleText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', paddingVertical: 4 },
  subjBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  subjBadgeActive: { backgroundColor: '#1e3c72', borderColor: '#1e3c72' },
  subjText: { fontSize: 12, color: '#475569' },
  subjTextActive: { color: '#ffffff', fontWeight: 'bold' },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', marginHorizontal: 10, marginVertical: 4, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, elevation: 1 },
  studentNameContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 10, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8 },
  bgGreen: { backgroundColor: '#27ae60' },
  bgRed: { backgroundColor: '#e74c3c' },
  textWhite: { color: '#ffffff' },
  studentIndex: { fontSize: 14, color: '#94a3b8', marginRight: 6, width: 22 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  buttonsContainer: { flexDirection: 'row', alignItems: 'center' },
  btnSB: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#27ae60', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, marginRight: 6 },
  btnSBActive: { backgroundColor: '#27ae60' },
  btnTextSB: { color: '#27ae60', fontWeight: '800', fontSize: 13 },
  btnBSB: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e74c3c', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  btnBSBActive: { backgroundColor: '#e74c3c' },
  btnTextBSB: { color: '#e74c3c', fontWeight: '800', fontSize: 13 },
  btnTextActive: { color: '#ffffff' },

  beautifulBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderColor: '#e2e8f0', justifyContent: 'space-between', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  beautifulBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  beautifulBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.3 },

  dayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 8 },
  dayHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3c72' },
  periodAdjustContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' },
  adjustBtn: { paddingHorizontal: 14, paddingVertical: 4 },
  adjustBtnText: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  periodCountText: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', paddingHorizontal: 6 },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 8 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e3c72' },
  classChip: { backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1' },
  classChipActive: { backgroundColor: '#1e3c72', borderColor: '#1e3c72' },
  classChipText: { color: '#334155', fontWeight: '600' },
  classChipTextActive: { color: '#fff' },
  input: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14 },
  actionSmallBtn: { backgroundColor: '#1e3c72', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, borderRadius: 8, marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  bigBtn: { backgroundColor: '#1e3c72', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  bigBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 6, marginTop: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingVertical: 10, paddingHorizontal: 6 },
  tableCol: { flex: 1, textAlign: 'center', fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  calendarCard: { width: '100%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  calHeader: { backgroundColor: '#2196F3', padding: 20 },
  calYearText: { color: '#bbdefb', fontSize: 16, fontWeight: 'bold' },
  calMonthText: { color: '#ffffff', fontSize: 26, fontWeight: 'bold', marginTop: 4 },
  calControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10 },
  calMonthLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  calArrow: { fontSize: 22, fontWeight: 'bold', color: '#555', paddingHorizontal: 10 },
  calDaysRow: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 10 },
  calDayLabel: { width: 35, textAlign: 'center', color: '#777', fontWeight: 'bold', fontSize: 12 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingBottom: 10 },
  calDayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calDayActive: { backgroundColor: '#2196F3', borderRadius: 20 },
  calDayText: { fontSize: 14, color: '#333' },
  calDayTextActive: { color: '#fff', fontWeight: 'bold' },
  calFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 10, borderTopWidth: 1, borderColor: '#eee' },
  calCancelBtn: { color: '#2196F3', fontWeight: 'bold', fontSize: 14 },
});