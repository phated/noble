#ifndef __NOBLE_H__
#define __NOBLE_H__

#include <node.h>

#include <string>
#include <vector>

#include <dispatch/dispatch.h>
#include <xpc/xpc.h>

class Noble : node::ObjectWrap {

public:
  static void Init(v8::Handle<v8::Object> target);
  static v8::Handle<v8::Value> New(const v8::Arguments& args);

  static v8::Handle<v8::Value> SetupXpcConnection(const v8::Arguments& args);
  static v8::Handle<v8::Value> SendXpcMessage(const v8::Arguments& args);

private:
  Noble();
  ~Noble();

  static xpc_object_t ObjectToXpcObject(v8::Handle<v8::Object> object);
  static v8::Handle<v8::Object> XpcObjectToObject(xpc_object_t xpcObject);
  static void HandleXpcEvent(uv_work_t* req);

  void setupXpcConnection();
  void sendXpcMessage(xpc_object_t message);
  void handleXpcEvent(xpc_object_t event);

private:
    dispatch_queue_t dispatchQueue;
    xpc_connection_t xpcConnnection;

    v8::Persistent<v8::Object> This;
};

#endif
