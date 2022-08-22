import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:archive/archive.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_archive/flutter_archive.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf_viewer_plugin/pdf_viewer_plugin.dart';
import 'package:shelf_static/shelf_static.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:xml/xml.dart';

import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as io;
import 'package:zip_read_new/pdf_viewer.dart';

const String zipFileName = 'bundle.zip';
const String extractDirectory = '/extract';

void main() {
  runApp(
      const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Scorm',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(title: 'Scorm'),
      builder: EasyLoading.init(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key, required this.title}) : super(key: key);
  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  late WebViewController _controller;

  @override
  void initState() {
    super.initState();
    if (Platform.isAndroid) WebView.platform = AndroidWebView();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      download();
    });


  }

  download() async {
    var dir = await getApplicationDocumentsDirectory();
    final Directory httpDirectory = Directory('${dir.path}/www');
    EasyLoading.show(status: 'Please wait...');

    if (!await httpDirectory.exists()) {
      await httpDirectory.create(recursive: true);
      await _downloadFile(dir.path, httpDirectory);
    }

    var handler = createStaticHandler(httpDirectory.path,
        defaultDocument: 'scorm.html',
        serveFilesOutsidePath: true,
        listDirectories: true);

    await runZonedGuarded(() async {
      String initialUrl = 'http://localhost:8080/scorm.html';

      String scormJS =  await rootBundle.loadString('assets/scorm.js');
      File jsFile = await File('${httpDirectory.path}/scorm.js').create();
      await jsFile.writeAsString(scormJS);

      String scormHtml = await rootBundle.loadString('assets/scorm.html');
      String updatedHTML =  scormHtml.replaceAll('<iframe name="course" id="courseFrame" width="100%" height="100%" src="" frameborder="0"',
          '<iframe name="course" id="courseFrame" width="100%" height="100%" src="/index_lms.html" frameborder="0"');

      File htmlFile = await File('${httpDirectory.path}/scorm.html').create();
      await htmlFile.writeAsString(updatedHTML);

      io.serve(handler, 'localhost', 8080);
      _controller.loadUrl(initialUrl);


EasyLoading.dismiss();
    }, (error, stack) {
      print('Error occured : $error $stack');
    });

  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        // actions: [
        //   IconButton(
        //     onPressed: (){
        //       download();
        //     },
        //     icon: const Icon(Icons.download),
        //   )
        // ],
      ),
      body: WebView(
        initialUrl: 'about:blank',
        javascriptMode: JavascriptMode.unrestricted,
        debuggingEnabled: true,
        allowsInlineMediaPlayback: true,
        initialMediaPlaybackPolicy: AutoMediaPlaybackPolicy.always_allow,
        userAgent:
            "'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Mobile Safari/537.36'",
        onWebViewCreated: (controller) {
          _controller = controller;
        },
        navigationDelegate: (NavigationRequest request) {
          var pdfString = request.url.substring(request.url.length - 3);
          if (pdfString == 'pdf') {
            Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => PdfViewer(url: request.url)),
            );
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        }
      ),
    );
  }

  Future<void> _downloadFile(String path, Directory dest) async {
    var request = await Dio(BaseOptions(responseType: ResponseType.bytes)).get(
        "https://github.com/lokhandeyogesh7/ScormSamples/raw/master/COVID-19-Awareness-2.zip");
    Archive archive = ZipDecoder().decodeBytes(request.data);
    for (ArchiveFile file in archive) {
      if (file.isFile) {
        List<int> data = file.content;
        File('${dest.path}/${file.name}')
          ..createSync(recursive: true)
          ..writeAsBytesSync(data);
      } else {
        Directory('${dest.path}/${file.name}').createSync(recursive: true);
      }
    }
  }
}
