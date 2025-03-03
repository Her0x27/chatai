#chatai
### special_objspecial_objectsects
```json
{
        # Системные папки и локации
        'мой компьютер': 'This PC',
        'корзина': 'Recycle Bin',
        'рабочий_стол': '%USERPROFILE%\\Desktop',
        'загрузки': '::{374DE290-123F-4565-9164-39C4925E467B}',
        'документы': '::{A8CDFF1C-4878-43be-B5FD-F8091C1C60D0}',
        'изображения': '::{3ADD1653-EB32-4cb0-BBD7-DFA0ABB5ACCA}',
        'музыка': '::{1CF1260C-4DD0-4ebb-811F-33C572699FDE}',
        'профиль': '%USERPROFILE%',
        'appdata': '%APPDATA%',
        'temp': '%TEMP%',
        'программы': 'shell:Programs',
        'автозагрузка': 'shell:Startup',
        'отправить': 'shell:SendTo',
        'шрифты': 'shell:Fonts',
        'system32': '%SystemRoot%\\System32',
        'windows': '%SystemRoot%',
        'program_files': '%ProgramFiles%',
        'program_files_x86': '%ProgramFiles(x86)%',

        # Диски и сеть
        'диск_c': 'C:',
        'диск_d': 'D:',
        'диск_e': 'E:',
        'сетевое_окружение': '::{208D2C60-3AEA-1069-A2D7-08002B30309D}',
        'общие_папки': 'net share',

        # Системные настройки и панели управления
        'панель управления': 'Control Panel',
        'параметры': 'ms-settings:',
        'настройки системы': 'ms-settings:system',
        'экран': 'ms-settings:display',
        'звук': 'ms-settings:sound',
        'сеть': 'ms-settings:network',
        'центр_безопасности': 'wscui.cpl',
        'брандмауэр': 'firewall.cpl',
        'диспетчер_устройств': 'devmgmt.msc',
        'службы': 'services.msc',
        'групповая_политика': 'gpedit.msc',
        'локальные_пользователи': 'lusrmgr.msc',
        'дисковые_квоты': 'dirkquota.msc',

        # Стандартные программы Windows
        'калькулятор': 'calc.exe',
        'блокнот': 'notepad.exe',
        'paint': 'mspaint.exe',
        'проводник': 'explorer.exe',
        'диспетчер задач': 'taskmgr.exe',
        'командная строка': 'cmd.exe',
        'повершелл': 'powershell.exe',
        'медиаплеер': 'wmplayer.exe',
        'громкость_микшер': 'SndVol.exe',
        'запись_звука': 'SoundRecorder.exe',
        'камера': 'microsoft.windows.camera:',
        'экранная_клавиатура': 'osk.exe',

        # Системные утилиты
        'редактор реестра': 'regedit.exe',
        'управление_компьютером': 'compmgmt.msc',
        'планировщик_задач': 'taskschd.msc',
        'просмотр_событий': 'eventvwr.msc',
        'сведения_о_системе': 'msinfo32.exe',
        'монитор_ресурсов': 'resmon.exe',
        'производительность': 'perfmon.exe',
        'восстановление_системы': 'rstrui.exe',
        'очистка_диска': 'cleanmgr.exe',
        'проверка_диска': 'chkdsk.exe',
        'проверка_памяти': 'MdSched.exe',
        'сведения_directx': 'dxdiag.exe',

        # Офисные приложения
        'word': 'winword.exe',
        'excel': 'excel.exe',
        'powerpoint': 'powerpnt.exe',
        'outlook': 'outlook.exe',

        # Браузеры
        'edge': 'msedge.exe',
        'chrome': 'chrome.exe',
        'firefox': 'firefox.exe',
        'opera': 'opera.exe',

        # Средства разработки
        'powershell_ise': 'powershell_ise.exe',
        'visual_studio_code': 'code.exe',
        'git_bash': 'git-bash.exe',
        'python': 'python.exe',
        'консоль_управления': 'mmc.exe',
        'редактор_скриптов': 'wscript.exe',

        # Специальные URL и приложения
        'магазин': 'ms-windows-store:',
        'почта': 'mailto:',
        'карты': 'bingmaps:',
        'погода': 'msnweather:',
        'виджеты': 'ms-widgets:',
        'часы': 'ms-clock:',
        'календарь': 'outlookcal:',
        'xbox_панель': 'xbox.exe',

        # Системные диалоги и команды
        'выполнить': 'shell:RunDialog',
        'завершение_работы': 'shutdown.exe',
        'диалог_печати': 'shell:PrintersFolder',
        'безопасный_режим': 'msconfig.exe',
        'режим_планшета': 'ms-settings:tabletmode',
        'игровой_режим': 'ms-settings:gaming-gamemode',
        'обновление_windows': 'ms-settings:windowsupdate',
        'персонализация': 'ms-settings:personalization',
        'учетные_записи': 'ms-settings:accounts',

        # Сетевые инструменты
        'удаленный_помощник': 'msra.exe',
        'подключение_vpn': 'rasphone.exe',
        'сетевые_подключения': 'ncpa.cpl',
        'удаленный_рабочий_стол': 'mstsc.exe',
        'сетевая_диагностика': 'msdt.exe -id NetworkDiagnosticsNetworkAdapter'
}
```
### WindowsInteractions[actions]
```json
{
        # Основные действия с окнами
        'открыть': {
            'aliases': ['запустить', 'показать', 'активировать'],
            'target_types': ['window', 'program', 'file', 'folder', 'link']
        },
        'закрыть': {
            'aliases': ['завершить', 'выключить'],
            'target_types': ['window', 'program', 'dialog']
        },
        'свернуть': {
            'aliases': ['минимизировать'],
            'target_types': ['window', 'program']
        },
        'развернуть': {
            'aliases': ['максимизировать', 'распахнуть'],
            'target_types': ['window', 'program']
        },
        
        # Действия с фокусом
        'переключить': {
            'aliases': ['перейти', 'сфокусировать'],
            'target_types': ['window', 'program', 'tab']
        },
        'активировать': {
            'aliases': ['выбрать', 'сделать активным'],
            'target_types': ['window', 'element', 'control']
        },
        
        # Действия с размером и положением
        'переместить': {
            'aliases': ['передвинуть', 'перетащить'],
            'parameters': ['влево', 'вправо', 'вверх', 'вниз', 'в центр']
        },
        'изменить_размер': {
            'aliases': ['растянуть', 'сжать'],
            'parameters': ['больше', 'меньше', 'по размеру экрана']
        },
        
        # Действия с элементами интерфейса
        'нажать': {
            'aliases': ['кликнуть', 'активировать'],
            'target_types': ['button', 'link', 'menu_item']
        },
        'выделить': {
            'aliases': ['пометить', 'выбрать'],
            'target_types': ['text', 'file', 'element']
        },
        
        # Действия с текстом
        'ввести': {
            'aliases': ['напечатать', 'вставить текст'],
            'target_types': ['textbox', 'editor', 'field']
        },
        'копировать': {
            'aliases': ['скопировать'],
            'target_types': ['text', 'file', 'element']
        },
        'вставить': {
            'aliases': ['вставить из буфера'],
            'target_types': ['textbox', 'editor', 'field']
        },
        
        # Действия с файлами
        'создать': {
            'aliases': ['новый', 'добавить'],
            'target_types': ['file', 'folder', 'shortcut']
        },
        'удалить': {
            'aliases': ['убрать', 'стереть'],
            'target_types': ['file', 'folder', 'shortcut', 'element']
        },
        'переименовать': {
            'aliases': ['изменить имя'],
            'target_types': ['file', 'folder', 'shortcut']
        },
        
        # Действия с меню
        'раскрыть': {
            'aliases': ['открыть меню', 'показать список'],
            'target_types': ['menu', 'dropdown', 'list']
        },
        'выбрать_пункт': {
            'aliases': ['выбрать опцию'],
            'target_types': ['menu_item', 'option', 'list_item']
        },
        
        # Системные действия
        'обновить': {
            'aliases': ['перезагрузить', 'освежить'],
            'target_types': ['window', 'view', 'page']
        },
        'найти': {
            'aliases': ['поиск', 'искать'],
            'target_types': ['file', 'text', 'program']
        },
        
        # Действия с вкладками
        'новая_вкладка': {
            'aliases': ['создать вкладку'],
            'target_types': ['browser', 'editor']
        },
        'закрыть_вкладку': {
            'aliases': ['удалить вкладку'],
            'target_types': ['browser', 'editor']
        },
        
        # Мультимедийные действия
        'воспроизвести': {
            'aliases': ['играть', 'запустить медиа'],
            'target_types': ['media', 'video', 'audio']
        },
        'остановить': {
            'aliases': ['пауза', 'стоп'],
            'target_types': ['media', 'video', 'audio']
        }
    }
```
