# api-sentinel
api-sentinel is a JS layer between back-end and front-end that converts private objects (from server) to public ones (for front-end) and vice-versa, using predefined schemas. For every entity that is transmitted to/from server, there are 2 files (descriptors) containing JSON schemas that describe it. 
One is public (used by the front-end developers) and describes how the entity should be transmitted to server. It also contains validators.
The other is private (only the back-end developers should have access to it) and describes what part of the entity is public or not. It also maps fields to DB fields, and has decorators defined.
