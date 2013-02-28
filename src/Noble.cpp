#import <Foundation/Foundation.h>


#include "Noble.h"

static v8::Persistent<v8::FunctionTemplate> s_ct;

class XpcEventData {
public:
  Noble::Noble *noble;
  xpc_object_t event;
};


void Noble::Init(v8::Handle<v8::Object> target) {
  v8::HandleScope scope;

  v8::Local<v8::FunctionTemplate> t = v8::FunctionTemplate::New(Noble::New);

  s_ct = v8::Persistent<v8::FunctionTemplate>::New(t);
  s_ct->InstanceTemplate()->SetInternalFieldCount(1);
  s_ct->SetClassName(v8::String::NewSymbol("Noble"));

  NODE_SET_PROTOTYPE_METHOD(s_ct, "setupXpcConnection", Noble::SetupXpcConnection);
  NODE_SET_PROTOTYPE_METHOD(s_ct, "sendXpcMessage", Noble::SendXpcMessage);

  target->Set(v8::String::NewSymbol("Noble"), s_ct->GetFunction());
}

Noble::Noble() : node::ObjectWrap() {
}

Noble::~Noble() {
}

void Noble::setupXpcConnection() {
  this->dispatchQueue = dispatch_queue_create("com.apple.blued", 0);
  this->xpcConnnection = xpc_connection_create_mach_service("com.apple.blued", this->dispatchQueue, XPC_CONNECTION_MACH_SERVICE_PRIVILEGED);

  xpc_connection_set_event_handler(this->xpcConnnection, ^(xpc_object_t event) {
    xpc_retain(event);
    this->handleXpcEvent(event);
  });

  xpc_connection_resume(this->xpcConnnection);
}

void Noble::sendXpcMessage(xpc_object_t message) {
  xpc_connection_send_message(this->xpcConnnection, message);
}

void Noble::handleXpcEvent(xpc_object_t event) {
  uv_work_t *req = new uv_work_t();

  XpcEventData* data = new XpcEventData;

  data->noble = this;
  data->event = event;

  req->data = data;

  uv_queue_work(uv_default_loop(), req, NULL, Noble::HandleXpcEvent);
}

v8::Handle<v8::Value> Noble::New(const v8::Arguments& args) {
  v8::HandleScope scope;
  Noble* p = new Noble();
  p->Wrap(args.This());
  p->This = v8::Persistent<v8::Object>::New(args.This());
  return args.This();
}


v8::Handle<v8::Value> Noble::SetupXpcConnection(const v8::Arguments& args) {
  v8::HandleScope scope;
  Noble* p = node::ObjectWrap::Unwrap<Noble>(args.This());

  p->setupXpcConnection();

  return scope.Close(v8::Undefined());
}

xpc_object_t Noble::ObjectToXpcObject(v8::Handle<v8::Object> object) {
  xpc_object_t xpcObject = xpc_dictionary_create(NULL, NULL, 0);

  v8::Handle<v8::Array> propertyNames = object->GetPropertyNames();

  for(uint32_t i = 0; i < propertyNames->Length(); i++) {
    v8::Handle<v8::Value> propertyName = propertyNames->Get(i);

    if (propertyName->IsString()) {
      v8::Handle<v8::String> propertyNameString = propertyName->ToString();
      v8::String::AsciiValue propertyNameStringValue(propertyNameString);
      v8::Handle<v8::Value> propertyValue = object->GetRealNamedProperty(propertyNameString);

      if (propertyValue->IsNumber()) {
        int64_t propertyIntgerValue = propertyValue->IntegerValue();

        xpc_dictionary_set_int64(xpcObject, *propertyNameStringValue, propertyIntgerValue);
      } else if (propertyValue->IsString()) {
        v8::Handle<v8::String> propertyValueString = propertyValue->ToString();
        v8::String::AsciiValue propertyValueStringValue(propertyValueString);

        xpc_dictionary_set_string(xpcObject, *propertyNameStringValue, *propertyValueStringValue);
      } else if (propertyValue->IsObject()) {
        v8::Handle<v8::Object> propertyValueObject = propertyValue->ToObject();

        xpc_object_t value = Noble::ObjectToXpcObject(propertyValueObject);
        xpc_dictionary_set_value(xpcObject, *propertyNameStringValue, value);
        xpc_release(value);
      }
    }
  }

  NSLog(@"xpcObject = %@", xpcObject);

  return xpcObject;
}

v8::Handle<v8::Object> Noble::XpcObjectToObject(xpc_object_t xpcObject) {
  v8::Handle<v8::Object> object = v8::Object::New();

  xpc_dictionary_apply(xpcObject, ^bool(const char *key, xpc_object_t value) {
    v8::Handle<v8::String> keyString = v8::String::New(key);
    xpc_type_t valueType = xpc_get_type(value);

    if (valueType == XPC_TYPE_INT64) {
      object->Set(keyString, v8::Integer::New(xpc_int64_get_value(value)));
    } else if(valueType == XPC_TYPE_STRING) {
      object->Set(keyString, v8::String::New(xpc_string_get_string_ptr(value)));
    } else if(valueType == XPC_TYPE_DICTIONARY) {
      object->Set(keyString, Noble::XpcObjectToObject(value));
    }

    return true;
  });

  return object;
}

void Noble::HandleXpcEvent(uv_work_t* req) {
  v8::HandleScope scope;
  XpcEventData* data = static_cast<XpcEventData*>(req->data);
  Noble::Noble *noble = data->noble;
  xpc_object_t event = data->event;

  xpc_type_t eventType = xpc_get_type(event);
  if (eventType == XPC_TYPE_ERROR) {
    const char* message = "unknown";

    if (event == XPC_ERROR_CONNECTION_INTERRUPTED) {
      message = "connection interrupted";
    } else if (event == XPC_ERROR_CONNECTION_INVALID) {
      message = "connection invalid";
    }

    v8::Handle<v8::Value> argv[2] = {
      v8::String::New("xpcError"),
      v8::String::New(message)
    };
    node::MakeCallback(noble->This, "emit", 2, argv);
  } else if (eventType == XPC_TYPE_DICTIONARY) {
    v8::Handle<v8::Object> eventObject = Noble::XpcObjectToObject(event);

    v8::Handle<v8::Value> argv[2] = {
      v8::String::New("xpcEvent"),
      eventObject
    };
    node::MakeCallback(noble->This, "emit", 2, argv);
  }

  xpc_release(event);
  delete data;
  delete req;
}

v8::Handle<v8::Value> Noble::SendXpcMessage(const v8::Arguments& args) {
  v8::HandleScope scope;
  Noble* p = node::ObjectWrap::Unwrap<Noble>(args.This());

  if (args.Length() > 0) {
    v8::Handle<v8::Value> arg0 = args[0];
    if (arg0->IsObject()) {
      v8::Handle<v8::Object> object = v8::Handle<v8::Object>::Cast(arg0);
   
      xpc_object_t message = Noble::ObjectToXpcObject(object);
      p->sendXpcMessage(message);
      xpc_release(message);
    }
  }

  return scope.Close(v8::Undefined());
}

extern "C" {

  static void init (v8::Handle<v8::Object> target) {
    Noble::Init(target);
  }

  NODE_MODULE(binding, init);
}
