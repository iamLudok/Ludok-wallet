// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database.dart';

// ignore_for_file: type=lint
class $RestaurantsTable extends Restaurants
    with TableInfo<$RestaurantsTable, Restaurant> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RestaurantsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    additionalChecks: GeneratedColumn.checkTextLength(
      minTextLength: 1,
      maxTextLength: 120,
    ),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cardTypeMeta = const VerificationMeta(
    'cardType',
  );
  @override
  late final GeneratedColumn<String> cardType = GeneratedColumn<String>(
    'card_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('other'),
  );
  static const VerificationMeta _photoPathMeta = const VerificationMeta(
    'photoPath',
  );
  @override
  late final GeneratedColumn<String> photoPath = GeneratedColumn<String>(
    'photo_path',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _photoBackPathMeta = const VerificationMeta(
    'photoBackPath',
  );
  @override
  late final GeneratedColumn<String> photoBackPath = GeneratedColumn<String>(
    'photo_back_path',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
    'phone',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _phone2Meta = const VerificationMeta('phone2');
  @override
  late final GeneratedColumn<String> phone2 = GeneratedColumn<String>(
    'phone2',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _emailMeta = const VerificationMeta('email');
  @override
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
    'email',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _addressMeta = const VerificationMeta(
    'address',
  );
  @override
  late final GeneratedColumn<String> address = GeneratedColumn<String>(
    'address',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _websiteMeta = const VerificationMeta(
    'website',
  );
  @override
  late final GeneratedColumn<String> website = GeneratedColumn<String>(
    'website',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _socialLinkMeta = const VerificationMeta(
    'socialLink',
  );
  @override
  late final GeneratedColumn<String> socialLink = GeneratedColumn<String>(
    'social_link',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _tagsMeta = const VerificationMeta('tags');
  @override
  late final GeneratedColumn<String> tags = GeneratedColumn<String>(
    'tags',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    cardType,
    photoPath,
    photoBackPath,
    phone,
    phone2,
    email,
    address,
    website,
    socialLink,
    tags,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'restaurants';
  @override
  VerificationContext validateIntegrity(
    Insertable<Restaurant> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('card_type')) {
      context.handle(
        _cardTypeMeta,
        cardType.isAcceptableOrUnknown(data['card_type']!, _cardTypeMeta),
      );
    }
    if (data.containsKey('photo_path')) {
      context.handle(
        _photoPathMeta,
        photoPath.isAcceptableOrUnknown(data['photo_path']!, _photoPathMeta),
      );
    }
    if (data.containsKey('photo_back_path')) {
      context.handle(
        _photoBackPathMeta,
        photoBackPath.isAcceptableOrUnknown(
          data['photo_back_path']!,
          _photoBackPathMeta,
        ),
      );
    }
    if (data.containsKey('phone')) {
      context.handle(
        _phoneMeta,
        phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta),
      );
    }
    if (data.containsKey('phone2')) {
      context.handle(
        _phone2Meta,
        phone2.isAcceptableOrUnknown(data['phone2']!, _phone2Meta),
      );
    }
    if (data.containsKey('email')) {
      context.handle(
        _emailMeta,
        email.isAcceptableOrUnknown(data['email']!, _emailMeta),
      );
    }
    if (data.containsKey('address')) {
      context.handle(
        _addressMeta,
        address.isAcceptableOrUnknown(data['address']!, _addressMeta),
      );
    }
    if (data.containsKey('website')) {
      context.handle(
        _websiteMeta,
        website.isAcceptableOrUnknown(data['website']!, _websiteMeta),
      );
    }
    if (data.containsKey('social_link')) {
      context.handle(
        _socialLinkMeta,
        socialLink.isAcceptableOrUnknown(data['social_link']!, _socialLinkMeta),
      );
    }
    if (data.containsKey('tags')) {
      context.handle(
        _tagsMeta,
        tags.isAcceptableOrUnknown(data['tags']!, _tagsMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Restaurant map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Restaurant(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      cardType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}card_type'],
      )!,
      photoPath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}photo_path'],
      ),
      photoBackPath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}photo_back_path'],
      ),
      phone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}phone'],
      ),
      phone2: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}phone2'],
      ),
      email: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}email'],
      ),
      address: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}address'],
      ),
      website: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}website'],
      ),
      socialLink: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}social_link'],
      ),
      tags: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}tags'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $RestaurantsTable createAlias(String alias) {
    return $RestaurantsTable(attachedDatabase, alias);
  }
}

class Restaurant extends DataClass implements Insertable<Restaurant> {
  final int id;
  final String name;

  /// Tipo de tarjeta: restaurant | person | shop | hotel | company | other
  final String cardType;
  final String? photoPath;
  final String? photoBackPath;
  final String? phone;
  final String? phone2;
  final String? email;
  final String? address;
  final String? website;
  final String? socialLink;

  /// Etiquetas separadas por comas.
  final String tags;
  final DateTime createdAt;
  const Restaurant({
    required this.id,
    required this.name,
    required this.cardType,
    this.photoPath,
    this.photoBackPath,
    this.phone,
    this.phone2,
    this.email,
    this.address,
    this.website,
    this.socialLink,
    required this.tags,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    map['card_type'] = Variable<String>(cardType);
    if (!nullToAbsent || photoPath != null) {
      map['photo_path'] = Variable<String>(photoPath);
    }
    if (!nullToAbsent || photoBackPath != null) {
      map['photo_back_path'] = Variable<String>(photoBackPath);
    }
    if (!nullToAbsent || phone != null) {
      map['phone'] = Variable<String>(phone);
    }
    if (!nullToAbsent || phone2 != null) {
      map['phone2'] = Variable<String>(phone2);
    }
    if (!nullToAbsent || email != null) {
      map['email'] = Variable<String>(email);
    }
    if (!nullToAbsent || address != null) {
      map['address'] = Variable<String>(address);
    }
    if (!nullToAbsent || website != null) {
      map['website'] = Variable<String>(website);
    }
    if (!nullToAbsent || socialLink != null) {
      map['social_link'] = Variable<String>(socialLink);
    }
    map['tags'] = Variable<String>(tags);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  RestaurantsCompanion toCompanion(bool nullToAbsent) {
    return RestaurantsCompanion(
      id: Value(id),
      name: Value(name),
      cardType: Value(cardType),
      photoPath: photoPath == null && nullToAbsent
          ? const Value.absent()
          : Value(photoPath),
      photoBackPath: photoBackPath == null && nullToAbsent
          ? const Value.absent()
          : Value(photoBackPath),
      phone: phone == null && nullToAbsent
          ? const Value.absent()
          : Value(phone),
      phone2: phone2 == null && nullToAbsent
          ? const Value.absent()
          : Value(phone2),
      email: email == null && nullToAbsent
          ? const Value.absent()
          : Value(email),
      address: address == null && nullToAbsent
          ? const Value.absent()
          : Value(address),
      website: website == null && nullToAbsent
          ? const Value.absent()
          : Value(website),
      socialLink: socialLink == null && nullToAbsent
          ? const Value.absent()
          : Value(socialLink),
      tags: Value(tags),
      createdAt: Value(createdAt),
    );
  }

  factory Restaurant.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Restaurant(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      cardType: serializer.fromJson<String>(json['cardType']),
      photoPath: serializer.fromJson<String?>(json['photoPath']),
      photoBackPath: serializer.fromJson<String?>(json['photoBackPath']),
      phone: serializer.fromJson<String?>(json['phone']),
      phone2: serializer.fromJson<String?>(json['phone2']),
      email: serializer.fromJson<String?>(json['email']),
      address: serializer.fromJson<String?>(json['address']),
      website: serializer.fromJson<String?>(json['website']),
      socialLink: serializer.fromJson<String?>(json['socialLink']),
      tags: serializer.fromJson<String>(json['tags']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'cardType': serializer.toJson<String>(cardType),
      'photoPath': serializer.toJson<String?>(photoPath),
      'photoBackPath': serializer.toJson<String?>(photoBackPath),
      'phone': serializer.toJson<String?>(phone),
      'phone2': serializer.toJson<String?>(phone2),
      'email': serializer.toJson<String?>(email),
      'address': serializer.toJson<String?>(address),
      'website': serializer.toJson<String?>(website),
      'socialLink': serializer.toJson<String?>(socialLink),
      'tags': serializer.toJson<String>(tags),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  Restaurant copyWith({
    int? id,
    String? name,
    String? cardType,
    Value<String?> photoPath = const Value.absent(),
    Value<String?> photoBackPath = const Value.absent(),
    Value<String?> phone = const Value.absent(),
    Value<String?> phone2 = const Value.absent(),
    Value<String?> email = const Value.absent(),
    Value<String?> address = const Value.absent(),
    Value<String?> website = const Value.absent(),
    Value<String?> socialLink = const Value.absent(),
    String? tags,
    DateTime? createdAt,
  }) => Restaurant(
    id: id ?? this.id,
    name: name ?? this.name,
    cardType: cardType ?? this.cardType,
    photoPath: photoPath.present ? photoPath.value : this.photoPath,
    photoBackPath: photoBackPath.present
        ? photoBackPath.value
        : this.photoBackPath,
    phone: phone.present ? phone.value : this.phone,
    phone2: phone2.present ? phone2.value : this.phone2,
    email: email.present ? email.value : this.email,
    address: address.present ? address.value : this.address,
    website: website.present ? website.value : this.website,
    socialLink: socialLink.present ? socialLink.value : this.socialLink,
    tags: tags ?? this.tags,
    createdAt: createdAt ?? this.createdAt,
  );
  Restaurant copyWithCompanion(RestaurantsCompanion data) {
    return Restaurant(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      cardType: data.cardType.present ? data.cardType.value : this.cardType,
      photoPath: data.photoPath.present ? data.photoPath.value : this.photoPath,
      photoBackPath: data.photoBackPath.present
          ? data.photoBackPath.value
          : this.photoBackPath,
      phone: data.phone.present ? data.phone.value : this.phone,
      phone2: data.phone2.present ? data.phone2.value : this.phone2,
      email: data.email.present ? data.email.value : this.email,
      address: data.address.present ? data.address.value : this.address,
      website: data.website.present ? data.website.value : this.website,
      socialLink: data.socialLink.present
          ? data.socialLink.value
          : this.socialLink,
      tags: data.tags.present ? data.tags.value : this.tags,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Restaurant(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('cardType: $cardType, ')
          ..write('photoPath: $photoPath, ')
          ..write('photoBackPath: $photoBackPath, ')
          ..write('phone: $phone, ')
          ..write('phone2: $phone2, ')
          ..write('email: $email, ')
          ..write('address: $address, ')
          ..write('website: $website, ')
          ..write('socialLink: $socialLink, ')
          ..write('tags: $tags, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    cardType,
    photoPath,
    photoBackPath,
    phone,
    phone2,
    email,
    address,
    website,
    socialLink,
    tags,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Restaurant &&
          other.id == this.id &&
          other.name == this.name &&
          other.cardType == this.cardType &&
          other.photoPath == this.photoPath &&
          other.photoBackPath == this.photoBackPath &&
          other.phone == this.phone &&
          other.phone2 == this.phone2 &&
          other.email == this.email &&
          other.address == this.address &&
          other.website == this.website &&
          other.socialLink == this.socialLink &&
          other.tags == this.tags &&
          other.createdAt == this.createdAt);
}

class RestaurantsCompanion extends UpdateCompanion<Restaurant> {
  final Value<int> id;
  final Value<String> name;
  final Value<String> cardType;
  final Value<String?> photoPath;
  final Value<String?> photoBackPath;
  final Value<String?> phone;
  final Value<String?> phone2;
  final Value<String?> email;
  final Value<String?> address;
  final Value<String?> website;
  final Value<String?> socialLink;
  final Value<String> tags;
  final Value<DateTime> createdAt;
  const RestaurantsCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.cardType = const Value.absent(),
    this.photoPath = const Value.absent(),
    this.photoBackPath = const Value.absent(),
    this.phone = const Value.absent(),
    this.phone2 = const Value.absent(),
    this.email = const Value.absent(),
    this.address = const Value.absent(),
    this.website = const Value.absent(),
    this.socialLink = const Value.absent(),
    this.tags = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  RestaurantsCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    this.cardType = const Value.absent(),
    this.photoPath = const Value.absent(),
    this.photoBackPath = const Value.absent(),
    this.phone = const Value.absent(),
    this.phone2 = const Value.absent(),
    this.email = const Value.absent(),
    this.address = const Value.absent(),
    this.website = const Value.absent(),
    this.socialLink = const Value.absent(),
    this.tags = const Value.absent(),
    this.createdAt = const Value.absent(),
  }) : name = Value(name);
  static Insertable<Restaurant> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<String>? cardType,
    Expression<String>? photoPath,
    Expression<String>? photoBackPath,
    Expression<String>? phone,
    Expression<String>? phone2,
    Expression<String>? email,
    Expression<String>? address,
    Expression<String>? website,
    Expression<String>? socialLink,
    Expression<String>? tags,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (cardType != null) 'card_type': cardType,
      if (photoPath != null) 'photo_path': photoPath,
      if (photoBackPath != null) 'photo_back_path': photoBackPath,
      if (phone != null) 'phone': phone,
      if (phone2 != null) 'phone2': phone2,
      if (email != null) 'email': email,
      if (address != null) 'address': address,
      if (website != null) 'website': website,
      if (socialLink != null) 'social_link': socialLink,
      if (tags != null) 'tags': tags,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  RestaurantsCompanion copyWith({
    Value<int>? id,
    Value<String>? name,
    Value<String>? cardType,
    Value<String?>? photoPath,
    Value<String?>? photoBackPath,
    Value<String?>? phone,
    Value<String?>? phone2,
    Value<String?>? email,
    Value<String?>? address,
    Value<String?>? website,
    Value<String?>? socialLink,
    Value<String>? tags,
    Value<DateTime>? createdAt,
  }) {
    return RestaurantsCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      cardType: cardType ?? this.cardType,
      photoPath: photoPath ?? this.photoPath,
      photoBackPath: photoBackPath ?? this.photoBackPath,
      phone: phone ?? this.phone,
      phone2: phone2 ?? this.phone2,
      email: email ?? this.email,
      address: address ?? this.address,
      website: website ?? this.website,
      socialLink: socialLink ?? this.socialLink,
      tags: tags ?? this.tags,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (cardType.present) {
      map['card_type'] = Variable<String>(cardType.value);
    }
    if (photoPath.present) {
      map['photo_path'] = Variable<String>(photoPath.value);
    }
    if (photoBackPath.present) {
      map['photo_back_path'] = Variable<String>(photoBackPath.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (phone2.present) {
      map['phone2'] = Variable<String>(phone2.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (address.present) {
      map['address'] = Variable<String>(address.value);
    }
    if (website.present) {
      map['website'] = Variable<String>(website.value);
    }
    if (socialLink.present) {
      map['social_link'] = Variable<String>(socialLink.value);
    }
    if (tags.present) {
      map['tags'] = Variable<String>(tags.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RestaurantsCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('cardType: $cardType, ')
          ..write('photoPath: $photoPath, ')
          ..write('photoBackPath: $photoBackPath, ')
          ..write('phone: $phone, ')
          ..write('phone2: $phone2, ')
          ..write('email: $email, ')
          ..write('address: $address, ')
          ..write('website: $website, ')
          ..write('socialLink: $socialLink, ')
          ..write('tags: $tags, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

class $TicketsTable extends Tickets with TableInfo<$TicketsTable, Ticket> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TicketsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    additionalChecks: GeneratedColumn.checkTextLength(
      minTextLength: 1,
      maxTextLength: 160,
    ),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _eventDateTimeMeta = const VerificationMeta(
    'eventDateTime',
  );
  @override
  late final GeneratedColumn<DateTime> eventDateTime =
      GeneratedColumn<DateTime>(
        'event_date_time',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _venueMeta = const VerificationMeta('venue');
  @override
  late final GeneratedColumn<String> venue = GeneratedColumn<String>(
    'venue',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _priceMeta = const VerificationMeta('price');
  @override
  late final GeneratedColumn<String> price = GeneratedColumn<String>(
    'price',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _codeDataMeta = const VerificationMeta(
    'codeData',
  );
  @override
  late final GeneratedColumn<String> codeData = GeneratedColumn<String>(
    'code_data',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _codeFormatMeta = const VerificationMeta(
    'codeFormat',
  );
  @override
  late final GeneratedColumn<String> codeFormat = GeneratedColumn<String>(
    'code_format',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('qrCode'),
  );
  static const VerificationMeta _imagePathMeta = const VerificationMeta(
    'imagePath',
  );
  @override
  late final GeneratedColumn<String> imagePath = GeneratedColumn<String>(
    'image_path',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    title,
    eventDateTime,
    venue,
    price,
    codeData,
    codeFormat,
    imagePath,
    notes,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'tickets';
  @override
  VerificationContext validateIntegrity(
    Insertable<Ticket> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('event_date_time')) {
      context.handle(
        _eventDateTimeMeta,
        eventDateTime.isAcceptableOrUnknown(
          data['event_date_time']!,
          _eventDateTimeMeta,
        ),
      );
    }
    if (data.containsKey('venue')) {
      context.handle(
        _venueMeta,
        venue.isAcceptableOrUnknown(data['venue']!, _venueMeta),
      );
    }
    if (data.containsKey('price')) {
      context.handle(
        _priceMeta,
        price.isAcceptableOrUnknown(data['price']!, _priceMeta),
      );
    }
    if (data.containsKey('code_data')) {
      context.handle(
        _codeDataMeta,
        codeData.isAcceptableOrUnknown(data['code_data']!, _codeDataMeta),
      );
    } else if (isInserting) {
      context.missing(_codeDataMeta);
    }
    if (data.containsKey('code_format')) {
      context.handle(
        _codeFormatMeta,
        codeFormat.isAcceptableOrUnknown(data['code_format']!, _codeFormatMeta),
      );
    }
    if (data.containsKey('image_path')) {
      context.handle(
        _imagePathMeta,
        imagePath.isAcceptableOrUnknown(data['image_path']!, _imagePathMeta),
      );
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Ticket map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Ticket(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      eventDateTime: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}event_date_time'],
      ),
      venue: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}venue'],
      ),
      price: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}price'],
      ),
      codeData: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}code_data'],
      )!,
      codeFormat: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}code_format'],
      )!,
      imagePath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}image_path'],
      ),
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $TicketsTable createAlias(String alias) {
    return $TicketsTable(attachedDatabase, alias);
  }
}

class Ticket extends DataClass implements Insertable<Ticket> {
  final int id;
  final String title;
  final DateTime? eventDateTime;
  final String? venue;
  final String? price;

  /// Valor del código (lo que se codifica en el QR/barras).
  final String codeData;

  /// Formato del código: qrCode, code128, ean13, etc.
  final String codeFormat;

  /// Captura opcional de la entrada original.
  final String? imagePath;
  final String? notes;
  final DateTime createdAt;
  const Ticket({
    required this.id,
    required this.title,
    this.eventDateTime,
    this.venue,
    this.price,
    required this.codeData,
    required this.codeFormat,
    this.imagePath,
    this.notes,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['title'] = Variable<String>(title);
    if (!nullToAbsent || eventDateTime != null) {
      map['event_date_time'] = Variable<DateTime>(eventDateTime);
    }
    if (!nullToAbsent || venue != null) {
      map['venue'] = Variable<String>(venue);
    }
    if (!nullToAbsent || price != null) {
      map['price'] = Variable<String>(price);
    }
    map['code_data'] = Variable<String>(codeData);
    map['code_format'] = Variable<String>(codeFormat);
    if (!nullToAbsent || imagePath != null) {
      map['image_path'] = Variable<String>(imagePath);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  TicketsCompanion toCompanion(bool nullToAbsent) {
    return TicketsCompanion(
      id: Value(id),
      title: Value(title),
      eventDateTime: eventDateTime == null && nullToAbsent
          ? const Value.absent()
          : Value(eventDateTime),
      venue: venue == null && nullToAbsent
          ? const Value.absent()
          : Value(venue),
      price: price == null && nullToAbsent
          ? const Value.absent()
          : Value(price),
      codeData: Value(codeData),
      codeFormat: Value(codeFormat),
      imagePath: imagePath == null && nullToAbsent
          ? const Value.absent()
          : Value(imagePath),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      createdAt: Value(createdAt),
    );
  }

  factory Ticket.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Ticket(
      id: serializer.fromJson<int>(json['id']),
      title: serializer.fromJson<String>(json['title']),
      eventDateTime: serializer.fromJson<DateTime?>(json['eventDateTime']),
      venue: serializer.fromJson<String?>(json['venue']),
      price: serializer.fromJson<String?>(json['price']),
      codeData: serializer.fromJson<String>(json['codeData']),
      codeFormat: serializer.fromJson<String>(json['codeFormat']),
      imagePath: serializer.fromJson<String?>(json['imagePath']),
      notes: serializer.fromJson<String?>(json['notes']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'title': serializer.toJson<String>(title),
      'eventDateTime': serializer.toJson<DateTime?>(eventDateTime),
      'venue': serializer.toJson<String?>(venue),
      'price': serializer.toJson<String?>(price),
      'codeData': serializer.toJson<String>(codeData),
      'codeFormat': serializer.toJson<String>(codeFormat),
      'imagePath': serializer.toJson<String?>(imagePath),
      'notes': serializer.toJson<String?>(notes),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  Ticket copyWith({
    int? id,
    String? title,
    Value<DateTime?> eventDateTime = const Value.absent(),
    Value<String?> venue = const Value.absent(),
    Value<String?> price = const Value.absent(),
    String? codeData,
    String? codeFormat,
    Value<String?> imagePath = const Value.absent(),
    Value<String?> notes = const Value.absent(),
    DateTime? createdAt,
  }) => Ticket(
    id: id ?? this.id,
    title: title ?? this.title,
    eventDateTime: eventDateTime.present
        ? eventDateTime.value
        : this.eventDateTime,
    venue: venue.present ? venue.value : this.venue,
    price: price.present ? price.value : this.price,
    codeData: codeData ?? this.codeData,
    codeFormat: codeFormat ?? this.codeFormat,
    imagePath: imagePath.present ? imagePath.value : this.imagePath,
    notes: notes.present ? notes.value : this.notes,
    createdAt: createdAt ?? this.createdAt,
  );
  Ticket copyWithCompanion(TicketsCompanion data) {
    return Ticket(
      id: data.id.present ? data.id.value : this.id,
      title: data.title.present ? data.title.value : this.title,
      eventDateTime: data.eventDateTime.present
          ? data.eventDateTime.value
          : this.eventDateTime,
      venue: data.venue.present ? data.venue.value : this.venue,
      price: data.price.present ? data.price.value : this.price,
      codeData: data.codeData.present ? data.codeData.value : this.codeData,
      codeFormat: data.codeFormat.present
          ? data.codeFormat.value
          : this.codeFormat,
      imagePath: data.imagePath.present ? data.imagePath.value : this.imagePath,
      notes: data.notes.present ? data.notes.value : this.notes,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Ticket(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('eventDateTime: $eventDateTime, ')
          ..write('venue: $venue, ')
          ..write('price: $price, ')
          ..write('codeData: $codeData, ')
          ..write('codeFormat: $codeFormat, ')
          ..write('imagePath: $imagePath, ')
          ..write('notes: $notes, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    title,
    eventDateTime,
    venue,
    price,
    codeData,
    codeFormat,
    imagePath,
    notes,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Ticket &&
          other.id == this.id &&
          other.title == this.title &&
          other.eventDateTime == this.eventDateTime &&
          other.venue == this.venue &&
          other.price == this.price &&
          other.codeData == this.codeData &&
          other.codeFormat == this.codeFormat &&
          other.imagePath == this.imagePath &&
          other.notes == this.notes &&
          other.createdAt == this.createdAt);
}

class TicketsCompanion extends UpdateCompanion<Ticket> {
  final Value<int> id;
  final Value<String> title;
  final Value<DateTime?> eventDateTime;
  final Value<String?> venue;
  final Value<String?> price;
  final Value<String> codeData;
  final Value<String> codeFormat;
  final Value<String?> imagePath;
  final Value<String?> notes;
  final Value<DateTime> createdAt;
  const TicketsCompanion({
    this.id = const Value.absent(),
    this.title = const Value.absent(),
    this.eventDateTime = const Value.absent(),
    this.venue = const Value.absent(),
    this.price = const Value.absent(),
    this.codeData = const Value.absent(),
    this.codeFormat = const Value.absent(),
    this.imagePath = const Value.absent(),
    this.notes = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  TicketsCompanion.insert({
    this.id = const Value.absent(),
    required String title,
    this.eventDateTime = const Value.absent(),
    this.venue = const Value.absent(),
    this.price = const Value.absent(),
    required String codeData,
    this.codeFormat = const Value.absent(),
    this.imagePath = const Value.absent(),
    this.notes = const Value.absent(),
    this.createdAt = const Value.absent(),
  }) : title = Value(title),
       codeData = Value(codeData);
  static Insertable<Ticket> custom({
    Expression<int>? id,
    Expression<String>? title,
    Expression<DateTime>? eventDateTime,
    Expression<String>? venue,
    Expression<String>? price,
    Expression<String>? codeData,
    Expression<String>? codeFormat,
    Expression<String>? imagePath,
    Expression<String>? notes,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (title != null) 'title': title,
      if (eventDateTime != null) 'event_date_time': eventDateTime,
      if (venue != null) 'venue': venue,
      if (price != null) 'price': price,
      if (codeData != null) 'code_data': codeData,
      if (codeFormat != null) 'code_format': codeFormat,
      if (imagePath != null) 'image_path': imagePath,
      if (notes != null) 'notes': notes,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  TicketsCompanion copyWith({
    Value<int>? id,
    Value<String>? title,
    Value<DateTime?>? eventDateTime,
    Value<String?>? venue,
    Value<String?>? price,
    Value<String>? codeData,
    Value<String>? codeFormat,
    Value<String?>? imagePath,
    Value<String?>? notes,
    Value<DateTime>? createdAt,
  }) {
    return TicketsCompanion(
      id: id ?? this.id,
      title: title ?? this.title,
      eventDateTime: eventDateTime ?? this.eventDateTime,
      venue: venue ?? this.venue,
      price: price ?? this.price,
      codeData: codeData ?? this.codeData,
      codeFormat: codeFormat ?? this.codeFormat,
      imagePath: imagePath ?? this.imagePath,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (eventDateTime.present) {
      map['event_date_time'] = Variable<DateTime>(eventDateTime.value);
    }
    if (venue.present) {
      map['venue'] = Variable<String>(venue.value);
    }
    if (price.present) {
      map['price'] = Variable<String>(price.value);
    }
    if (codeData.present) {
      map['code_data'] = Variable<String>(codeData.value);
    }
    if (codeFormat.present) {
      map['code_format'] = Variable<String>(codeFormat.value);
    }
    if (imagePath.present) {
      map['image_path'] = Variable<String>(imagePath.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TicketsCompanion(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('eventDateTime: $eventDateTime, ')
          ..write('venue: $venue, ')
          ..write('price: $price, ')
          ..write('codeData: $codeData, ')
          ..write('codeFormat: $codeFormat, ')
          ..write('imagePath: $imagePath, ')
          ..write('notes: $notes, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $RestaurantsTable restaurants = $RestaurantsTable(this);
  late final $TicketsTable tickets = $TicketsTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [restaurants, tickets];
}

typedef $$RestaurantsTableCreateCompanionBuilder =
    RestaurantsCompanion Function({
      Value<int> id,
      required String name,
      Value<String> cardType,
      Value<String?> photoPath,
      Value<String?> photoBackPath,
      Value<String?> phone,
      Value<String?> phone2,
      Value<String?> email,
      Value<String?> address,
      Value<String?> website,
      Value<String?> socialLink,
      Value<String> tags,
      Value<DateTime> createdAt,
    });
typedef $$RestaurantsTableUpdateCompanionBuilder =
    RestaurantsCompanion Function({
      Value<int> id,
      Value<String> name,
      Value<String> cardType,
      Value<String?> photoPath,
      Value<String?> photoBackPath,
      Value<String?> phone,
      Value<String?> phone2,
      Value<String?> email,
      Value<String?> address,
      Value<String?> website,
      Value<String?> socialLink,
      Value<String> tags,
      Value<DateTime> createdAt,
    });

class $$RestaurantsTableFilterComposer
    extends Composer<_$AppDatabase, $RestaurantsTable> {
  $$RestaurantsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cardType => $composableBuilder(
    column: $table.cardType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get photoPath => $composableBuilder(
    column: $table.photoPath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get photoBackPath => $composableBuilder(
    column: $table.photoBackPath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get phone2 => $composableBuilder(
    column: $table.phone2,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get email => $composableBuilder(
    column: $table.email,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get address => $composableBuilder(
    column: $table.address,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get website => $composableBuilder(
    column: $table.website,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get socialLink => $composableBuilder(
    column: $table.socialLink,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get tags => $composableBuilder(
    column: $table.tags,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$RestaurantsTableOrderingComposer
    extends Composer<_$AppDatabase, $RestaurantsTable> {
  $$RestaurantsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cardType => $composableBuilder(
    column: $table.cardType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get photoPath => $composableBuilder(
    column: $table.photoPath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get photoBackPath => $composableBuilder(
    column: $table.photoBackPath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get phone2 => $composableBuilder(
    column: $table.phone2,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get email => $composableBuilder(
    column: $table.email,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get address => $composableBuilder(
    column: $table.address,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get website => $composableBuilder(
    column: $table.website,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get socialLink => $composableBuilder(
    column: $table.socialLink,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get tags => $composableBuilder(
    column: $table.tags,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$RestaurantsTableAnnotationComposer
    extends Composer<_$AppDatabase, $RestaurantsTable> {
  $$RestaurantsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get cardType =>
      $composableBuilder(column: $table.cardType, builder: (column) => column);

  GeneratedColumn<String> get photoPath =>
      $composableBuilder(column: $table.photoPath, builder: (column) => column);

  GeneratedColumn<String> get photoBackPath => $composableBuilder(
    column: $table.photoBackPath,
    builder: (column) => column,
  );

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<String> get phone2 =>
      $composableBuilder(column: $table.phone2, builder: (column) => column);

  GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  GeneratedColumn<String> get address =>
      $composableBuilder(column: $table.address, builder: (column) => column);

  GeneratedColumn<String> get website =>
      $composableBuilder(column: $table.website, builder: (column) => column);

  GeneratedColumn<String> get socialLink => $composableBuilder(
    column: $table.socialLink,
    builder: (column) => column,
  );

  GeneratedColumn<String> get tags =>
      $composableBuilder(column: $table.tags, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$RestaurantsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $RestaurantsTable,
          Restaurant,
          $$RestaurantsTableFilterComposer,
          $$RestaurantsTableOrderingComposer,
          $$RestaurantsTableAnnotationComposer,
          $$RestaurantsTableCreateCompanionBuilder,
          $$RestaurantsTableUpdateCompanionBuilder,
          (
            Restaurant,
            BaseReferences<_$AppDatabase, $RestaurantsTable, Restaurant>,
          ),
          Restaurant,
          PrefetchHooks Function()
        > {
  $$RestaurantsTableTableManager(_$AppDatabase db, $RestaurantsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$RestaurantsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$RestaurantsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$RestaurantsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String> cardType = const Value.absent(),
                Value<String?> photoPath = const Value.absent(),
                Value<String?> photoBackPath = const Value.absent(),
                Value<String?> phone = const Value.absent(),
                Value<String?> phone2 = const Value.absent(),
                Value<String?> email = const Value.absent(),
                Value<String?> address = const Value.absent(),
                Value<String?> website = const Value.absent(),
                Value<String?> socialLink = const Value.absent(),
                Value<String> tags = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => RestaurantsCompanion(
                id: id,
                name: name,
                cardType: cardType,
                photoPath: photoPath,
                photoBackPath: photoBackPath,
                phone: phone,
                phone2: phone2,
                email: email,
                address: address,
                website: website,
                socialLink: socialLink,
                tags: tags,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String name,
                Value<String> cardType = const Value.absent(),
                Value<String?> photoPath = const Value.absent(),
                Value<String?> photoBackPath = const Value.absent(),
                Value<String?> phone = const Value.absent(),
                Value<String?> phone2 = const Value.absent(),
                Value<String?> email = const Value.absent(),
                Value<String?> address = const Value.absent(),
                Value<String?> website = const Value.absent(),
                Value<String?> socialLink = const Value.absent(),
                Value<String> tags = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => RestaurantsCompanion.insert(
                id: id,
                name: name,
                cardType: cardType,
                photoPath: photoPath,
                photoBackPath: photoBackPath,
                phone: phone,
                phone2: phone2,
                email: email,
                address: address,
                website: website,
                socialLink: socialLink,
                tags: tags,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$RestaurantsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $RestaurantsTable,
      Restaurant,
      $$RestaurantsTableFilterComposer,
      $$RestaurantsTableOrderingComposer,
      $$RestaurantsTableAnnotationComposer,
      $$RestaurantsTableCreateCompanionBuilder,
      $$RestaurantsTableUpdateCompanionBuilder,
      (
        Restaurant,
        BaseReferences<_$AppDatabase, $RestaurantsTable, Restaurant>,
      ),
      Restaurant,
      PrefetchHooks Function()
    >;
typedef $$TicketsTableCreateCompanionBuilder =
    TicketsCompanion Function({
      Value<int> id,
      required String title,
      Value<DateTime?> eventDateTime,
      Value<String?> venue,
      Value<String?> price,
      required String codeData,
      Value<String> codeFormat,
      Value<String?> imagePath,
      Value<String?> notes,
      Value<DateTime> createdAt,
    });
typedef $$TicketsTableUpdateCompanionBuilder =
    TicketsCompanion Function({
      Value<int> id,
      Value<String> title,
      Value<DateTime?> eventDateTime,
      Value<String?> venue,
      Value<String?> price,
      Value<String> codeData,
      Value<String> codeFormat,
      Value<String?> imagePath,
      Value<String?> notes,
      Value<DateTime> createdAt,
    });

class $$TicketsTableFilterComposer
    extends Composer<_$AppDatabase, $TicketsTable> {
  $$TicketsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get eventDateTime => $composableBuilder(
    column: $table.eventDateTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get venue => $composableBuilder(
    column: $table.venue,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get price => $composableBuilder(
    column: $table.price,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get codeData => $composableBuilder(
    column: $table.codeData,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get codeFormat => $composableBuilder(
    column: $table.codeFormat,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get imagePath => $composableBuilder(
    column: $table.imagePath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$TicketsTableOrderingComposer
    extends Composer<_$AppDatabase, $TicketsTable> {
  $$TicketsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get eventDateTime => $composableBuilder(
    column: $table.eventDateTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get venue => $composableBuilder(
    column: $table.venue,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get price => $composableBuilder(
    column: $table.price,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get codeData => $composableBuilder(
    column: $table.codeData,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get codeFormat => $composableBuilder(
    column: $table.codeFormat,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get imagePath => $composableBuilder(
    column: $table.imagePath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$TicketsTableAnnotationComposer
    extends Composer<_$AppDatabase, $TicketsTable> {
  $$TicketsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<DateTime> get eventDateTime => $composableBuilder(
    column: $table.eventDateTime,
    builder: (column) => column,
  );

  GeneratedColumn<String> get venue =>
      $composableBuilder(column: $table.venue, builder: (column) => column);

  GeneratedColumn<String> get price =>
      $composableBuilder(column: $table.price, builder: (column) => column);

  GeneratedColumn<String> get codeData =>
      $composableBuilder(column: $table.codeData, builder: (column) => column);

  GeneratedColumn<String> get codeFormat => $composableBuilder(
    column: $table.codeFormat,
    builder: (column) => column,
  );

  GeneratedColumn<String> get imagePath =>
      $composableBuilder(column: $table.imagePath, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$TicketsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $TicketsTable,
          Ticket,
          $$TicketsTableFilterComposer,
          $$TicketsTableOrderingComposer,
          $$TicketsTableAnnotationComposer,
          $$TicketsTableCreateCompanionBuilder,
          $$TicketsTableUpdateCompanionBuilder,
          (Ticket, BaseReferences<_$AppDatabase, $TicketsTable, Ticket>),
          Ticket,
          PrefetchHooks Function()
        > {
  $$TicketsTableTableManager(_$AppDatabase db, $TicketsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TicketsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TicketsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TicketsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<DateTime?> eventDateTime = const Value.absent(),
                Value<String?> venue = const Value.absent(),
                Value<String?> price = const Value.absent(),
                Value<String> codeData = const Value.absent(),
                Value<String> codeFormat = const Value.absent(),
                Value<String?> imagePath = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => TicketsCompanion(
                id: id,
                title: title,
                eventDateTime: eventDateTime,
                venue: venue,
                price: price,
                codeData: codeData,
                codeFormat: codeFormat,
                imagePath: imagePath,
                notes: notes,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String title,
                Value<DateTime?> eventDateTime = const Value.absent(),
                Value<String?> venue = const Value.absent(),
                Value<String?> price = const Value.absent(),
                required String codeData,
                Value<String> codeFormat = const Value.absent(),
                Value<String?> imagePath = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => TicketsCompanion.insert(
                id: id,
                title: title,
                eventDateTime: eventDateTime,
                venue: venue,
                price: price,
                codeData: codeData,
                codeFormat: codeFormat,
                imagePath: imagePath,
                notes: notes,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$TicketsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $TicketsTable,
      Ticket,
      $$TicketsTableFilterComposer,
      $$TicketsTableOrderingComposer,
      $$TicketsTableAnnotationComposer,
      $$TicketsTableCreateCompanionBuilder,
      $$TicketsTableUpdateCompanionBuilder,
      (Ticket, BaseReferences<_$AppDatabase, $TicketsTable, Ticket>),
      Ticket,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$RestaurantsTableTableManager get restaurants =>
      $$RestaurantsTableTableManager(_db, _db.restaurants);
  $$TicketsTableTableManager get tickets =>
      $$TicketsTableTableManager(_db, _db.tickets);
}
