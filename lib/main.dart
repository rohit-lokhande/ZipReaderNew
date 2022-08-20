import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:archive/archive.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_archive/flutter_archive.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shelf_static/shelf_static.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:xml/xml.dart';

import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as io;

const String zipFileName = 'bundle.zip';
const String extractDirectory = '/extract';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Zip Extractor',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(title: 'Zip Extractor'),
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
  String status = "Download";
  @override
  void initState() {
    super.initState();
    if (Platform.isAndroid) WebView.platform = AndroidWebView();
  }

  download() async {
    setState(() {
      status = "Downloading";
    });
    var dir = await getApplicationDocumentsDirectory();
    final Directory httpDirectory =
        await Directory('${dir.path}/www').create(recursive: true);
    await _downloadFile(dir.path, httpDirectory);
    var handler = createStaticHandler(httpDirectory.path,
        defaultDocument: 'index_lms.html',
        serveFilesOutsidePath: true,
        listDirectories: true);

    await runZoned(() async {
      const String initialUrl = 'http://localhost:8080/index_lms.html';
      io.serve(handler, 'localhost', 8080);
      _controller.loadUrl(initialUrl);
    }, onError: (e, stackTrace) => print('Error occured : $e $stackTrace'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: WebView(
        initialUrl: 'https://www.google.co.in/',
        javascriptMode: JavascriptMode.unrestricted,
        debuggingEnabled: true,

        userAgent:
            "'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Mobile Safari/537.36'",
        onWebViewCreated: (controller) {
          _controller = controller;
        },
        // navigationDelegate: (NavigationRequest request) {
        //   // if (request.url.startsWith('https://my.redirect.url.com'))
        //   // {
        //   //   print('blocking navigation to $request}');
        //   //   // _launchURL('https://my.redirect.url.com');
        //   //   return NavigationDecision.prevent;
        //   // }
        //
        //   print('allowing navigation to $request');
        //   return NavigationDecision.navigate;
        // },
        onPageStarted: (page) {
          print(page);
        },
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            GestureDetector(
              onTap: () {
                _controller.goBack();
              },
              child: Row(
                children: [
                  Container(
                    height: 40,
                    width: 80,
                    decoration: BoxDecoration(
                        color: Colors.blueAccent,
                        borderRadius: BorderRadius.circular(6)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.arrow_back,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: () {
                _controller.goForward();
              },
              child: Row(
                children: [
                  Container(
                    height: 40,
                    width: 80,
                    decoration: BoxDecoration(
                        color: Colors.blueAccent,
                        borderRadius: BorderRadius.circular(6)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.arrow_forward,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: download,
              child: Row(
                children: [
                  Container(
                    height: 40,
                    width: 140,
                    decoration: BoxDecoration(
                        color: Colors.blueAccent,
                        borderRadius: BorderRadius.circular(6)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          status,
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w600),
                        ),
                        const Icon(
                          Icons.download,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
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

  Future<XmlDocument> getManifestFile(String directory) async {
    File mainFest = File("$directory/imsmanifest.xml");
    XmlDocument document = XmlDocument.parse(mainFest.readAsStringSync());
    return document;
  }

  String getIndexFileName(XmlDocument manifestFile) {
    String name = '';
    var data = manifestFile.findAllElements('resources');
    for (var element in data) {
      var child = element.findAllElements('resource');
      for (var ch in child) {
        var attribute = ch.attributes.firstWhere((p0) {
          return p0.name == XmlName("href");
        });
        name = attribute.value;
        break;
      }
    }
    return name;
  }
}
